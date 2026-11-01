import { Column, Entity } from 'typeorm';
import { FileType } from '../../../common/enum/file_type.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('media')
export class Media extends AbstractEntity<Media> {
    @Column({ nullable: false })
    publicId: string;

    @Column({ nullable: true })
    label: string;

    @Column({ type: 'text', nullable: false })
    url: string;

    @Column({ type: 'text', nullable: true })
    optimizedUrl: string;

    @Column({ nullable: true })
    folder: string;

    @Column({ nullable: true })
    format: string;

    @Column({ nullable: true })
    mimetype: string;

    @Column({ type: 'int', nullable: true })
    width: number;

    @Column({ type: 'int', nullable: true })
    height: number;

    @Column({ type: 'int', default: 0 })
    bytes: number;

    @Column({ nullable: false, type: 'enum', enum: FileType })
    type: FileType;

    @Column({ nullable: true })
    resourceType: string;

    @Column({ nullable: true })
    ownerId: string;

    @Column({ default: false })
    isTemporary: boolean;
}
