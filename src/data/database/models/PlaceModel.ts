import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class PlaceModel extends Model {
  static table = 'places';

  @field('name') name!: string;
  @field('type') type!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_deleted') isDeleted!: number;
}
