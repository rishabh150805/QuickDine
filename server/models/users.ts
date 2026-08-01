import {Document, model, Schema} from "mongoose"
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    Phone?: string;
    role: "user" | "admin" | "owner";
    createdAt: Date;
    updatedAt: Date;
}
const UserSchema = new Schema<IUser>(
    {
        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, unique: true, trim: true, lowercase: true},
        password: {type: String, required: true, minlength: 6},
        Phone: {type: String, trim: true, minlength: 10},
        role: {type: String, enum: ["user","admin", "owner"], default: "user"}

    },
    {
        timestamps: true
    }
)

UserSchema.set("toJSON",{
    transform: (doc, ret) => {
        // ret may be a plain object; cast to any so delete is allowed
        delete (ret as any).password;
        return ret;
    }
});

export const User = model<IUser>("User", UserSchema)