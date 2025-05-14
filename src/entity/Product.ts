
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column("text")
  description!: string;

  @Column("float")
  price!: number;

  @Column()
  image!: string;

  @Column()
  category!: string;

  @ManyToOne(() => User, (user: User) => user.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sellerId" })
  seller!: User;

  @Column()
  sellerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
