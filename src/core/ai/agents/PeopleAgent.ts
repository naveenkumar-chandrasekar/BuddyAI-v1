import { Q } from '@nozbe/watermelondb';
import { llamaService } from '../LlamaService';
import { getDb } from '../../../data/database/database';
import type PersonModel from '../../../data/database/models/PersonModel';

export type PeopleAgentResult =
  | { type: 'action'; action: string; data: Record<string, unknown>; message: string }
  | { type: 'question'; question: string; partial: Record<string, unknown> }
  | { type: 'error'; message: string };

const SYSTEM = `You are a contacts manager. Reply ONLY in valid JSON, no other text.
{"action":"ACTION","message":"friendly 1-sentence reply","data":{}}

Actions and required data fields:
CREATE_PERSON: {"name":"exact name from user message","relationship_type":"family|friend|work|school|other","birthday":"YYYY-MM-DD","phone":"","notes":""}
UPDATE_PERSON: {"name":"exact name from contacts list","phone":"","birthday":"YYYY-MM-DD","notes":""}
DELETE_PERSON: {"name":"exact name from contacts list"}
CREATE_CONNECTION: {"person1_name":"exact name from list","person2_name":"exact name from list","label":"relationship label"}

Rules:
- name must be copied EXACTLY from user message (CREATE) or contacts list (mutations)
- relationship_type must be one of: family, friend, work, school, other
- birthday format: YYYY-MM-DD only
- omit optional fields if not mentioned
- NEVER invent names not in user message or contacts list`;

const REL_KEYWORDS: Record<string, string> = {
  family: 'family', mom: 'family', dad: 'family', mother: 'family', father: 'family',
  brother: 'family', sister: 'family', wife: 'family', husband: 'family',
  son: 'family', daughter: 'family', uncle: 'family', aunt: 'family', cousin: 'family',
  friend: 'friend', buddy: 'friend', neighbor: 'friend',
  colleague: 'work', coworker: 'work', work: 'work', office: 'work', boss: 'work', manager: 'work',
  school: 'school', classmate: 'school', teacher: 'school',
  college: 'friend', university: 'friend',
};

function extractRelationship(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(REL_KEYWORDS)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) return val;
  }
  return null;
}

function fuzzyFind(hint: string, people: PersonModel[]): PersonModel | null {
  const lower = hint.toLowerCase().trim();
  return (
    people.find(p => p.name.toLowerCase() === lower) ??
    people.find(p => p.name.toLowerCase().includes(lower)) ??
    people.find(p => lower.includes(p.name.toLowerCase())) ??
    null
  );
}

async function loadAllPeople(): Promise<PersonModel[]> {
  return getDb()
    .collections.get<PersonModel>('persons')
    .query(
      Q.where('is_deleted', false),
      Q.sortBy('name', Q.asc),
      Q.take(20),
    )
    .fetch();
}

function buildContext(people: PersonModel[]): string {
  if (people.length === 0) return 'Contacts list: empty';
  const lines = people.map(p => {
    const parts = [`"${p.name}"`, `[${p.relationshipType}]`];
    if (p.birthday) parts.push(`[birthday: ${p.birthday}]`);
    if (p.phone) parts.push(`[phone: ${p.phone}]`);
    return parts.join(' ');
  });
  return `Contacts list:\n${lines.join('\n')}`;
}

export async function processPeopleMessage(
  userText: string,
  partial?: Record<string, unknown>,
): Promise<PeopleAgentResult> {
  if (!llamaService.isInitialized) return { type: 'error', message: 'AI model not loaded.' };

  const people = await loadAllPeople();
  const context = buildContext(people);
  const prompt = `<|im_start|>system\n${SYSTEM}\n\n${context}<|im_end|>\n<|im_start|>user\n${userText}<|im_end|>\n<|im_start|>assistant\n{"action":"`;

  try {
    const raw = await llamaService.complete(prompt);
    const jsonMatch = (`{"action":"` + raw).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { type: 'error', message: 'Could not understand that.' };

    const parsed = JSON.parse(jsonMatch[0]) as { action: string; message: string; data: Record<string, unknown> };
    if (!parsed.action || !parsed.message) return { type: 'error', message: 'Invalid response.' };

    const data: Record<string, unknown> = { ...partial, ...parsed.data };

    if (parsed.action === 'CREATE_PERSON') {
      const name = String(data.name ?? '').trim();
      if (!name || !userText.toLowerCase().includes(name.toLowerCase())) {
        return { type: 'question', question: "What's the person's full name?", partial: data };
      }
      if (!data.relationship_type) {
        const rel = extractRelationship(userText);
        if (rel) {
          data.relationship_type = rel;
        } else {
          return {
            type: 'question',
            question: `What's ${name}'s relationship? (family / friend / work / school / other)`,
            partial: data,
          };
        }
      }
      return { type: 'action', action: 'CREATE_PERSON', data, message: parsed.message };
    }

    if (parsed.action === 'UPDATE_PERSON' || parsed.action === 'DELETE_PERSON') {
      const nameHint = String(data.name ?? '').trim();
      if (!nameHint) return { type: 'question', question: "Which person's name?", partial: data };
      const match = fuzzyFind(nameHint, people);
      if (!match) {
        const list = people.slice(0, 5).map(p => `"${p.name}"`).join(', ');
        return {
          type: 'question',
          question: `Couldn't find "${nameHint}". Your contacts: ${list || 'none'}. Which one?`,
          partial: { ...data, action: parsed.action },
        };
      }
      data.id = match.id;
      data.name = match.name;
      return { type: 'action', action: parsed.action, data, message: parsed.message };
    }

    if (parsed.action === 'CREATE_CONNECTION') {
      const name1 = String(data.person1_name ?? '').trim();
      const name2 = String(data.person2_name ?? '').trim();
      if (!name1 || !name2) {
        return {
          type: 'question',
          question: "Please mention both people's names. e.g. 'relate John and Sarah as siblings'",
          partial: data,
        };
      }
      const match1 = fuzzyFind(name1, people);
      const match2 = fuzzyFind(name2, people);
      if (!match1) return { type: 'question', question: `Couldn't find "${name1}" in your contacts.`, partial: data };
      if (!match2) return { type: 'question', question: `Couldn't find "${name2}" in your contacts.`, partial: data };
      data.person1_name = match1.name;
      data.person2_name = match2.name;
      return { type: 'action', action: 'CREATE_CONNECTION', data, message: parsed.message };
    }

    return { type: 'action', action: parsed.action, data, message: parsed.message };
  } catch {
    return { type: 'error', message: 'Something went wrong.' };
  }
}
