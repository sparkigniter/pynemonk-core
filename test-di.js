import "reflect-metadata";
import { container } from "tsyringe";
import setupDI from "./services/pynemonk-core-auth/dist/di.js";
import AuthController from "./services/pynemonk-core-auth/dist/api/modules/auth/controllers/AuthController.js";

setupDI();
try {
    const ctrl = container.resolve(AuthController);
    console.log("Resolved successfully!", ctrl);
} catch (e) {
    console.error(e);
}
