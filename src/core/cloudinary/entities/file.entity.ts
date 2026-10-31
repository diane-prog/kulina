import { Column, Entity } from 'typeorm';
import { FileType } from '../../../common/enum/file_type.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('files')
export class Files extends AbstractEntity<Files> {
    @Column({ nullable: false })
    publicId: string;

    @Column({ nullable: true })
    label: string;

    @Column({ type: 'text', nullable: false })
    path: string;

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

    @Column({ default: 0, type: 'float', nullable: false })
    size: number;

    @Column({ nullable: false, type: 'enum', enum: FileType })
    type: FileType;

    @Column({ nullable: true })
    resourceType: string;

    @Column({ default: false })
    isTemporary: boolean;
}
