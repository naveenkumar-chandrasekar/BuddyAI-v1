import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class PersonConnectionModel extends Model {
  static table = 'person_connections';

  @field('person_id') personId!: string;
  @field('related_person_id') relatedPersonId!: string;
  @field('label') label!: string;
  @readonly @date('created_at') createdAt!: Date;
  @field('is_deleted') isDeleted!: number;
}
