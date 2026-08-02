// create new booking
//POST /api/bookings
// acces private
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { Restaurant } from '../models/Restaurant.js';
import { Booking } from '../models/Booking.js';

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { restaurantId, date, time, numberOfGuests, occasion, specialRequests } = req.body;

        if(!restaurantId || !date || !time || !numberOfGuests) {
            res.status(400).json({ message: 'Please provide all required reservation details' });
            return;
        }
        //Check if resturant exists   
        const restaurant = await Restaurant.findById(restaurantId);
        if(!restaurant) {
            res.status(404).json({ message: 'Restaurant not found' });
            return;
        }

        //Verify restaurant is approved
        if(restaurant.status !== 'approved') {
            res.status(400).json({ message: 'Reservation are not open for this restaurant' });
            return;
        }
        //Verify seat availbility
        const requestedGuests = Number(numberOfGuests);

        const existingBookings = await Booking.find({ 
            restaurant: restaurantId, 
            date: new Date(date), 
            time,
            status: "confirmed",
         });
        
         const bookedSeats = existingBookings.reduce((sum, booking) => sum + booking.guests, 0);

         const totalSeats = restaurant.totalSeats || 20;
         const availableSeats = totalSeats - bookedSeats;

         if(requestedGuests > availableSeats) {
             res.status(400).json({ message: `Unable to reserve. Only ${availableSeats} seats are available.` });
             return;
         }

         const booking = new Booking({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time,
            guests: Number(numberOfGuests),
            occasion,
            specialRequests,
            status: "confirmed",
         });

         //populate restaurant info before returning
         const populatedBooking = await booking.populate("restaurant", "name location image address");
         res.status(201).json(populatedBooking);
    } catch (error: any) {
        console.error(error)
        res.status(400).json({ message: 'Error creating booking' });
    }
}
// get all bookings
//GET /api/bookings/my
// acces private

export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find({ user: req.user?._id }).populate("restaurant", "name location image address slug").sort({ date: -1, time: -1 });
        res.json(bookings);
    } catch (error: any) {
        console.error(error)
        res.status(400).json({ message: 'Error fetching bookings' });
    }
}

// cancel bookings
//PUT /api/bookings/:id/cancel
// acces private

export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const booking = await Booking.findById(req.params.id);
        if(!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;

        }
        // verify user owns the booking
        if((booking as any).user.toString() !== req.user?._id.toString()) {
            res.status(401).json({ message: 'You are not authorized to cancel this booking' });
            return;
        }

        // cancel the booking
        booking.status = 'canceled';
        await booking.save();

        const populatedBooking = await booking.populate("restaurant", "name location image address ");
        
        res.json(populatedBooking);

    } catch (error: any) {
        console.error(error)
        res.status(400).json( {message: error.message });
    }
}
