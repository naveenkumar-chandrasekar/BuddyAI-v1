const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const SPACE = 'appDataFolder';

async function findFileId(filename: string, accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${filename}' and trashed=false`);
  const res = await fetch(
    `${DRIVE_API}?spaces=${SPACE}&q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const json = await res.json() as { files: { id: string }[] };
  return json.files?.[0]?.id ?? null;
}

export async function uploadFile(
  filename: string,
  content: string,
  accessToken: string,
): Promise<void> {
  const existingId = await findFileId(filename, accessToken);
  const metadata = JSON.stringify(
    existingId ? {} : { name: filename, parents: [SPACE] },
  );
  const body = new FormData();
  body.append('metadata', { string: metadata, type: 'application/json' } as unknown as Blob);
  body.append('file', { string: content, type: 'text/plain' } as unknown as Blob);

  const url = existingId
    ? `${UPLOAD_API}/${existingId}?uploadType=multipart`
    : `${UPLOAD_API}?uploadType=multipart`;
  const method = existingId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
}

export async function downloadFile(
  filename: string,
  accessToken: string,
): Promise<string | null> {
  const fileId = await findFileId(filename, accessToken);
  if (!fileId) return null;

  const res = await fetch(
    `${DRIVE_API}/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  return res.text();
}

export async function deleteFile(
  filename: string,
  accessToken: string,
): Promise<void> {
  const fileId = await findFileId(filename, accessToken);
  if (!fileId) return;
  await fetch(`${DRIVE_API}/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
