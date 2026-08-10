import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/users.js";
import { Booking } from "../models/Booking.js";


// get all restaurants for admin management
// GET /api/admin/restaurants

export const getAllResturants = async (req: AuthRequest, res: Response) => {
  try {
    const resturants = await Restaurant.find({}).populate("owner","name email phone").
    sort({ createdAt: -1})
    res.json(Restaurant)
  } catch (error:any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve / reject a resturant profile

// PUT /api/admin/restaurants/id:/ approve

export const approveRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const{ status } = req.body;
    if(!status || !["approved","rejected","pending"].includes(status)) {
      res.status(400).json({ message: "Please provide a valid approval status" });
      return;
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if(!restaurant){
        res.status(404).json({ message: "Restaurant profile not found"})
        return;
    }

    restaurant.status = status;
    await restaurant.save();

    res.json(restaurant);
  } catch (error:any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get system statistic

// PUT /api/admin/stats

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUser = await User.countDocuments({ role: "user"})
    const totalOwner = await User.countDocuments({ role: "owner"})
    const totalBooking = await Booking.countDocuments({})
    const totalRestaurants = await Restaurant.countDocuments({})

    //get latest 10 booking
    const latestBooking = await Booking.find({}).populate("user" , "name email").populate("restaurant" , "name").sort({createdAt: -1}).limit(10)

    res.json({
        user: {
            totalUser,
            totalOwner,
            total: totalUser + totalOwner,
            
        },
        restaurants:{
            total: totalRestaurants,
        },
        bookings: {
            total: totalBooking,
        },
        latestBooking
    })

  } catch (error:any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
