
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";
import { Dispute } from "./Dispute";

export type CommentUserRole = "buyer" | "seller" | "admin";

@Entity("dispute_comments")
export class DisputeComment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Dispute, (dispute) => dispute.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "disputeId" })
  dispute!: Dispute;
  
  @Column()
  disputeId!: string;

  @ManyToOne(() => User, (user) => user.disputeComments)
  @JoinColumn({ name: "userId" })
  user!: User;
  
  @Column()
  userId!: string;

  @Column({
    type: "simple-enum",
    enum: ["buyer", "seller", "admin"]
  })
  userRole!: CommentUserRole;

  @Column("text")
  content!: string;

  @Column("simple-json")
  attachments!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
