import { Router } from "express";
import { getFeaturedRestaurants, getRestaurants, getRestaurantsBySlug, getRestaurantsAvailability } from "../controllers/RestaurantController.js";

const restaurantRouter = Router();

restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/featured", getFeaturedRestaurants);
restaurantRouter.get("/:slug", getRestaurantsBySlug);
restaurantRouter.get("/:id/availability", getRestaurantsAvailability);


export default restaurantRouter;