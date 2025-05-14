
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { Product } from "./Product";
import { Escrow } from "./Escrow";
import { Dispute } from "./Dispute";
import { DisputeComment } from "./DisputeComment";

export type UserRole = "buyer" | "seller" | "admin";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({
    type: "simple-enum",
    enum: ["buyer", "seller", "admin"],
    default: "buyer"
  })
  role!: UserRole;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: "float", default: 0 })
  walletBalance!: number;

  @OneToMany(() => Product, product => product.seller)
  products!: Product[];

  @OneToMany(() => Escrow, escrow => escrow.buyer)
  buyerEscrows!: Escrow[];

  @OneToMany(() => Escrow, escrow => escrow.seller)
  sellerEscrows!: Escrow[];

  @OneToMany(() => Dispute, dispute => dispute.user)
  disputes!: Dispute[];

  @OneToMany(() => DisputeComment, comment => comment.user)
  disputeComments!: DisputeComment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
