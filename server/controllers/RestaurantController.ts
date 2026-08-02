import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/users.js";
import { Booking } from "../models/Booking.js";
import { time } from "node:console";


// get all restaurants
// get api/restaurants
export const getRestaurants = async (req:Request, res:Response): Promise<void> => {
    try{
        const {search, PriceRange, Rating, Location, Sort} = req.query;

        // Build query object
        const queryObj: any = {status: "approved"};

        if(search){
            queryObj.$or = [
                {name: { $regex: search, $options: "i" }},
                {tags: { $regex: search, $options: "i" }},
                {location: { $regex: search, $options: "i" }},
            ]
        }

        if(PriceRange){
            const prices = Array.isArray(PriceRange) ? PriceRange : [PriceRange];
            queryObj.priceRange = { $in: prices };
        }

         if(Rating){
             queryObj.rating = { $gte: parseFloat(Rating as string) };
        }
         if(Location){
             queryObj.location = { $regex: Location, $options: "i" };
        }

        // Sorting
        let sortOption: any = {createdAt: -1};
        if(Sort === "rating"){
            sortOption = {rating: -1};
        }else if(Sort === "price_low"){
            sortOption = {priceRange: 1};
        }else if(Sort === "price_high"){
            sortOption = {priceRange: -1};
        }
        
        const restaurants = await Restaurant.find(queryObj).sort(sortOption);
        res.json(restaurants);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: "Error fetching restaurants" });
    }
}

// get all restaurants
// get api/restaurants/ feature
export const getFeaturedRestaurants = async (req:Request, res:Response): Promise<void> => {
    try{
        const feature = await Restaurant.find({
            status: "approved",
            $or: [{ feature: true }, { exclusive: true }]
        }).limit(6)
        res.json(feature);
    } catch (error: any) {
        console.error("Get Featured Restaurants Error:", error);
        res.status(500).json({ message: "Error fetching restaurants" });
    }
}

// get single restaurants by slug
// get api/restaurants/:slug
export const getRestaurantsBySlug = async (req:Request, res:Response): Promise<void> => {
    try{
        const restaurant = await Restaurant.findOne({ slug: req.params.slug });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }

        if (restaurant.status !== "approved") {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

                    const user = await User.findById(decoded.id);
                    if (user && (user.role === "admin" || (user.role === "owner" && restaurant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true;
                    }
                } catch (err) {
                    // token invalid or verification failed
                }
            }

            if (!isAuthorized) {
                res.status(403).json({ message: "You are not authorized to view this restaurant" });
                return;
            }
        }

        res.json(restaurant);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: "Error fetching restaurants" });
    }
}

// get dynamic seat avability based on date and time
// get api/restaurants/:slug/availability?date=2023-08-15&time=19:00

export const getRestaurantsAvailability = async (req:Request, res:Response): Promise<void> => {
    try{
        const { date } = req.query;
        if(!date){
            res.status(400).json({ message: "Date query parameter is required" });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }

        const bookingDate = new Date(date as string)

        // get all active booking
        const bookings = await Booking.find({
            restaurant: restaurant._id,
            date: bookingDate,
            status: "confirmed"
        })

        //Map slots to available capacities
        const availability = restaurant.availableSlots.map((slot)=>{
            const bookedSeats = bookings.filter((b)=> b.time === slot).reduce((sum, b)=> sum + b.guests, 0);

            const totalSeats = restaurant.totalSeats || 20;
            const availableSeats = Math.max(0, totalSeats - bookedSeats);

            return {
                time: slot,
                isAvailable: availableSeats > 0,
            }
        })

        res.json(availability);

    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: "Error fetching restaurants" });
    }
}