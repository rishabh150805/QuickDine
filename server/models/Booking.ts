import {Document, model, Schema, Types} from "mongoose"
import crypto from "crypto";
export interface IBooking extends Document {
    name: Types.ObjectId;
    resturant: Types.ObjectId;
    date: Date;
    time: string;
    guests: number;
    occasion?: string;
    specialRequests?: string;
    status: "pending" | "confirmed" | "canceled";
    bookingId: string;
    createdAt: Date;
    updatedAt: Date;
}
const BookingSchema = new Schema<IBooking>(
    {
        name: {type: Schema.Types.ObjectId, ref: "User", required: true},
        resturant: {type: Schema.Types.ObjectId, ref: "Restaurant", required: true},
        date: {type: Date, required: true},
        time: {type: String, required: true},
        guests: {type: Number, required: true, min: 1},
        occasion: {type: String, trim: true},
        specialRequests: {type: String, trim: true},
        status: {type: String, enum: ["pending", "confirmed", "canceled"], default: "pending"},
        bookingId: {type: String, required: true, unique: true},

    },
    {
        timestamps: true
    }
)
// auto-genrte ref code on save
BookingSchema.pre("save", function(){
    if(!this.bookingId){
        this.bookingId = `GR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    }
});

export const Booking = model<IBooking>("Booking", BookingSchema)
