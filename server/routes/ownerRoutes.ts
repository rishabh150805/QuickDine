import { Router, RequestHandler } from "express";
import { createOwnerRestaurant, getOwnerBookings, getOwnerRestaurant, UpdateBookingStatus, updateOwnerRestaurant } from "../controllers/ownerController.js";
import upload from "../config/multer.js";
import { ownerOnly, protect } from "../middlewares/auth.js";

const ownerRouter = Router();

ownerRouter.use(protect)
ownerRouter.use(ownerOnly)

ownerRouter.get("/restaurant", getOwnerRestaurant)
ownerRouter.post("/restaurant", upload.single("image"), createOwnerRestaurant)
ownerRouter.put("/restaurant", upload.single("image"), updateOwnerRestaurant)
ownerRouter.get("/bookings", getOwnerBookings)
ownerRouter.put("/booking/:id/status", UpdateBookingStatus)


export default ownerRouter;