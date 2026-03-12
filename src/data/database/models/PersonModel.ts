import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class PersonModel extends Model {
  static table = 'persons';

  @field('name') name!: string;
  @field('relationship_type') relationshipType!: string;
  @field('custom_relation') customRelation!: string | null;
  @field('priority') priority!: number;
  @field('birthday') birthday!: string | null;
  @field('phone') phone!: string | null;
  @field('email') email!: string | null;
  @field('notes') notes!: string | null;
  @field('last_contacted_at') lastContactedAt!: number | null;
  @field('contact_frequency') contactFrequency!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_deleted') isDeleted!: number;
}
