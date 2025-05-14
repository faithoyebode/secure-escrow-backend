
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { User } from "./User";
import { Escrow } from "./Escrow";
import { DisputeComment } from "./DisputeComment";

export type DisputeRaiser = "buyer" | "seller";
export type DisputeStatus = "pending" | "resolved" | "rejected";

@Entity("disputes")
export class Dispute {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Escrow, (escrow) => escrow.disputes)
  @JoinColumn({ name: "escrowId" })
  escrow!: Escrow;

  @Column()
  escrowId!: string;

  @Column({
    type: "simple-enum",
    enum: ["buyer", "seller"]
  })
  raisedBy!: DisputeRaiser;

  @ManyToOne(() => User, (user) => user.disputes)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @Column("text")
  reason!: string;

  @Column("simple-json")
  evidence!: string[];

  @Column({
    type: "simple-enum",
    enum: ["pending", "resolved", "rejected"],
    default: "pending"
  })
  status!: DisputeStatus;

  @Column({ nullable: true, type: "text" })
  adminNotes?: string;

  @Column({ nullable: true, type: "datetime" })
  resolvedAt?: Date;

  @OneToMany(() => DisputeComment, (comment) => comment.dispute)
  comments!: DisputeComment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
