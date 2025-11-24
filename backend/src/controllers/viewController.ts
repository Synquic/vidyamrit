import { AuthRequest } from "../types/auth";
import { Request, Response } from "express";
import { auth } from "../configs/firebaseAdmin";
import View, { IView } from "../models/ViewModel";
import User from "../models/UserModel";
import { UserRole } from "../configs/roles";
import logger from "../utils/logger";
import { aggregateViewData } from "../services/viewDataService";
import mongoose from "mongoose";

function logWithViewInfo(message: string, view?: any, error?: any) {
  if (view && view.name && typeof view.name === 'string') {
    logger.info(`[View: ${view.name}] ${message}`);
  } else {
    logger.info(message);
  }
  if (error) {
    console.error("=== DETAILED ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error kind:", error.kind);
    console.error("Error value:", error.value);
    console.error("Error path:", error.path);
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
  }
}

/**
 * Get view for current user (for view users)
 */
export const getMyView = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== UserRole.VIEW_USER) {
      return res.status(403).json({ error: "Only view users can access this endpoint" });
    }

    const view = await View.findOne({ "viewUser.uid": req.user.uid })
      .select("-viewUser.password")
      .populate("createdBy", "name email");

    if (!view) {
      return res.status(404).json({ error: "View not found for this user" });
    }

    res.json(view);
  } catch (error: any) {
    logWithViewInfo("Error fetching user's view:", error);
    res.status(500).json({ error: "Failed to fetch view" });
  }
};

/**
 * Create a new view
 * Only super_admin can create views
 */
export const createView = async (req: AuthRequest, res: Response) => {
  let firebaseUser = null;

  try {
    const { name, description, stakeholderType, customStakeholderType, config, viewUser } =
      req.body;

    // Validate required fields
    if (!name || !stakeholderType || !config || !viewUser?.email || !viewUser?.password) {
      return res.status(400).json({
        error: "Missing required fields: name, stakeholderType, config, viewUser.email, viewUser.password",
      });
    }

    // Check if view with same email already exists
    const existingView = await View.findOne({ "viewUser.email": viewUser.email });
    if (existingView) {
      return res.status(400).json({ error: "View with this email already exists" });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: viewUser.email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Create Firebase user first
    firebaseUser = await auth.createUser({
      email: viewUser.email,
      password: viewUser.password,
      displayName: name,
    });

    try {
      // Create MongoDB user for view
      const user = new User({
        uid: firebaseUser.uid,
        name: name,
        email: firebaseUser.email,
        phoneNo: "0000000000", // View users don't need phone, but field is required
        role: UserRole.VIEW_USER,
        schoolId: null,
      });

      await user.save();

      // Create View document
      const view = new View({
        name,
        description,
        stakeholderType,
        customStakeholderType:
          stakeholderType === "custom" ? customStakeholderType : undefined,
        createdBy: req.user?._id,
        config,
        viewUser: {
          email: firebaseUser.email!,
          password: "", // Don't store password
          uid: firebaseUser.uid,
          isActive: true,
        },
      });

      await view.save();

      logWithViewInfo("View created successfully", view);

      res.status(201).json({
        id: view._id,
        name: view.name,
        description: view.description,
        stakeholderType: view.stakeholderType,
        customStakeholderType: view.customStakeholderType,
        viewUser: {
          email: view.viewUser.email,
          isActive: view.viewUser.isActive,
        },
        createdAt: view.createdAt,
        updatedAt: view.updatedAt,
      });
    } catch (mongoError) {
      // If MongoDB save fails, clean up the Firebase user
      if (firebaseUser) {
        try {
          await auth.deleteUser(firebaseUser.uid);
          logWithViewInfo(
            `Cleaned up: Firebase user ${firebaseUser.uid} deleted due to MongoDB error`
          );
        } catch (deleteErr) {
          logWithViewInfo(
            "Failed to delete Firebase user during cleanup:",
            firebaseUser
          );
        }
      }
      throw mongoError;
    }
  } catch (error: any) {
    logWithViewInfo("Error creating view:", error);
    res.status(500).json({
      error: error.message || "Failed to create view. Please try again.",
    });
  }
};

/**
 * Get all views
 * Only super_admin can list views
 */
export const getViews = async (req: AuthRequest, res: Response) => {
  try {
    const views = await View.find()
      .select("-viewUser.password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(views);
  } catch (error: any) {
    logWithViewInfo("Error fetching views:", error);
    res.status(500).json({ error: "Failed to fetch views" });
  }
};

/**
 * Get a single view by ID
 */
export const getView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const view = await View.findById(id)
      .select("-viewUser.password")
      .populate("createdBy", "name email");

    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    res.json(view);
  } catch (error: any) {
    logWithViewInfo("Error fetching view:", error);
    res.status(500).json({ error: "Failed to fetch view" });
  }
};

/**
 * Update a view
 * Only super_admin can update views
 */
export const updateView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, stakeholderType, customStakeholderType, config } =
      req.body;

    const view = await View.findById(id);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    // Update fields
    if (name !== undefined) view.name = name;
    if (description !== undefined) view.description = description;
    if (stakeholderType !== undefined) view.stakeholderType = stakeholderType;
    if (customStakeholderType !== undefined)
      view.customStakeholderType = customStakeholderType;
    if (config !== undefined) view.config = config;

    await view.save();

    logWithViewInfo("View updated successfully", view);

    res.json({
      id: view._id,
      name: view.name,
      description: view.description,
      stakeholderType: view.stakeholderType,
      customStakeholderType: view.customStakeholderType,
      config: view.config,
      viewUser: {
        email: view.viewUser.email,
        isActive: view.viewUser.isActive,
      },
      updatedAt: view.updatedAt,
    });
  } catch (error: any) {
    logWithViewInfo("Error updating view:", error);
    res.status(500).json({
      error: error.message || "Failed to update view",
    });
  }
};

/**
 * Delete a view
 * Only super_admin can delete views
 */
export const deleteView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const view = await View.findById(id);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    // Delete Firebase user
    try {
      await auth.deleteUser(view.viewUser.uid);
      logWithViewInfo("Firebase user deleted", view);
    } catch (firebaseError: any) {
      logWithViewInfo(
        `Failed to delete Firebase user: ${firebaseError.message}`,
        view
      );
      // Continue with MongoDB deletion even if Firebase deletion fails
    }

    // Delete MongoDB user
    try {
      await User.findOneAndDelete({ uid: view.viewUser.uid });
      logWithViewInfo("MongoDB user deleted", view);
    } catch (mongoError: any) {
      logWithViewInfo(
        `Failed to delete MongoDB user: ${mongoError.message}`,
        view
      );
    }

    // Delete view
    await View.findByIdAndDelete(id);

    logWithViewInfo("View deleted successfully", view);

    res.json({ message: "View deleted successfully" });
  } catch (error: any) {
    logWithViewInfo("Error deleting view:", error);
    res.status(500).json({ error: "Failed to delete view" });
  }
};

/**
 * Get aggregated data for a view
 * Can be accessed by view user or super_admin
 */
export const getViewData = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const view = await View.findById(id);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    // Check if user has access to this view
    // Super admin can access any view
    // View user can only access their own view
    if (req.user?.role === UserRole.VIEW_USER) {
      if (view.viewUser.uid !== req.user.uid) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Aggregate data based on view configuration
    const data = await aggregateViewData(view.config);

    res.json({
      viewId: view._id,
      viewName: view.name,
      data,
    });
  } catch (error: any) {
    logWithViewInfo("Error fetching view data:", error);
    res.status(500).json({ error: "Failed to fetch view data" });
  }
};

/**
 * Get view data for current user (for view users)
 */
export const getMyViewData = async (req: AuthRequest, res: Response) => {
  console.log("\n========== getMyViewData FUNCTION CALLED ==========");
  logger.info("\n========== getMyViewData FUNCTION CALLED ==========");
  console.log("Step 1: Function started");
  logger.info("Step 1: Function started");
  
  try {
    console.log("Step 2: Checking user role");
    logger.info("Step 2: Checking user role");
    console.log(`User role: ${req.user?.role}`);
    logger.info(`User role: ${req.user?.role}`);
    
    if (req.user?.role !== UserRole.VIEW_USER) {
      console.log("Step 2 FAILED: User is not VIEW_USER");
      logger.info("Step 2 FAILED: User is not VIEW_USER");
      return res.status(403).json({ error: "Only view users can access this endpoint" });
    }
    console.log("Step 2 SUCCESS: User is VIEW_USER");
    logger.info("Step 2 SUCCESS: User is VIEW_USER");

    console.log("Step 3: Fetching view from database");
    logger.info("Step 3: Fetching view from database");
    console.log(`Searching for view with uid: ${req.user.uid}`);
    logger.info(`Searching for view with uid: ${req.user.uid}`);
    
    // Retrieve view without .lean() to keep Mongoose document structure
    const view = await View.findOne({ "viewUser.uid": req.user.uid });
    
    if (!view) {
      console.log("Step 3 FAILED: View not found");
      logger.info("Step 3 FAILED: View not found");
      return res.status(404).json({ error: "View not found for this user" });
    }
    console.log("Step 3 SUCCESS: View found");
    logger.info("Step 3 SUCCESS: View found");
    console.log(`View name: ${view.name}`);
    logger.info(`View name: ${view.name}`);
    console.log(`View ID: ${view._id}`);
    logger.info(`View ID: ${view._id}`);

    console.log("Step 4: Checking if view user is active");
    logger.info("Step 4: Checking if view user is active");
    console.log(`View user isActive: ${view.viewUser.isActive}`);
    logger.info(`View user isActive: ${view.viewUser.isActive}`);
    
    if (!view.viewUser.isActive) {
      console.log("Step 4 FAILED: View user is not active");
      logger.info("Step 4 FAILED: View user is not active");
      return res.status(403).json({ error: "View access is deactivated" });
    }
    console.log("Step 4 SUCCESS: View user is active");
    logger.info("Step 4 SUCCESS: View user is active");

    console.log("Step 5: Getting config from view");
    logger.info("Step 5: Getting config from view");
    console.log(`view.config type: ${typeof view.config}`);
    logger.info(`view.config type: ${typeof view.config}`);
    console.log(`view.config exists: ${!!view.config}`);
    logger.info(`view.config exists: ${!!view.config}`);
    
    // Get config - view.config is a Mongoose subdocument
    // Use toObject() to convert to plain object, but ObjectIds should remain as ObjectIds
    let config: any;
    try {
      console.log("Step 5.1: Attempting to convert config");
      logger.info("Step 5.1: Attempting to convert config");
      const configDoc = view.config as any;
      console.log(`configDoc type: ${typeof configDoc}`);
      logger.info(`configDoc type: ${typeof configDoc}`);
      console.log(`configDoc has toObject: ${typeof configDoc?.toObject}`);
      logger.info(`configDoc has toObject: ${typeof configDoc?.toObject}`);
      
      if (configDoc && typeof configDoc === 'object') {
        if (typeof configDoc.toObject === 'function') {
          console.log("Step 5.2: Calling toObject() on config");
          logger.info("Step 5.2: Calling toObject() on config");
          // Use toObject() which should preserve ObjectIds
          config = configDoc.toObject({ getters: false, virtuals: false, flattenObjectIds: false });
          console.log("Step 5.2 SUCCESS: Config converted using toObject()");
          logger.info("Step 5.2 SUCCESS: Config converted using toObject()");
          console.log(`Config after toObject type: ${typeof config}`);
          logger.info(`Config after toObject type: ${typeof config}`);
          console.log(`Config access allowedSchools: ${JSON.stringify(config?.access?.allowedSchools)}`);
          logger.info(`Config access allowedSchools: ${JSON.stringify(config?.access?.allowedSchools)}`);
        } else {
          console.log("Step 5.2: Config doesn't have toObject, using as-is");
          logger.info("Step 5.2: Config doesn't have toObject, using as-is");
          config = configDoc;
        }
      } else {
        console.log("Step 5.2: Config is not an object, using as-is");
        logger.info("Step 5.2: Config is not an object, using as-is");
        config = configDoc;
      }
    } catch (err: any) {
      console.error("Step 5 FAILED: Error converting config");
      logger.error("Step 5 FAILED: Error converting config");
      console.error(`Error: ${err.message}`);
      logger.error(`Error: ${err.message}`);
      throw new Error("Failed to process view configuration");
    }
    console.log("Step 5 SUCCESS: Config retrieved");
    logger.info("Step 5 SUCCESS: Config retrieved");
    
    console.log("Step 6: Converting string ObjectIds to ObjectId instances");
    logger.info("Step 6: Converting string ObjectIds to ObjectId instances");
    console.log(`Config before conversion - allowedSchools: ${JSON.stringify(config?.access?.allowedSchools)}`);
    logger.info(`Config before conversion - allowedSchools: ${JSON.stringify(config?.access?.allowedSchools)}`);
    if (config?.access?.allowedSchools && Array.isArray(config.access.allowedSchools) && config.access.allowedSchools.length > 0) {
      console.log(`First school ID before conversion: ${config.access.allowedSchools[0]}`);
      logger.info(`First school ID before conversion: ${config.access.allowedSchools[0]}`);
      console.log(`First school ID type before: ${typeof config.access.allowedSchools[0]}`);
      logger.info(`First school ID type before: ${typeof config.access.allowedSchools[0]}`);
      console.log(`Is ObjectId before: ${config.access.allowedSchools[0] instanceof mongoose.Types.ObjectId}`);
      logger.info(`Is ObjectId before: ${config.access.allowedSchools[0] instanceof mongoose.Types.ObjectId}`);
    }
    
    // Recursively convert any string ObjectIds back to ObjectId instances
    // This is necessary because toObject() might convert them to strings
    const ensureObjectIds = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(item => {
          if (typeof item === 'string' && mongoose.Types.ObjectId.isValid(item) && item.length === 24) {
            return new mongoose.Types.ObjectId(item);
          }
          if (item instanceof mongoose.Types.ObjectId) {
            return item;
          }
          if (typeof item === 'object' && item !== null) {
            return ensureObjectIds(item);
          }
          return item;
        });
      }
      
      if (typeof obj === 'object' && obj.constructor === Object) {
        const result: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && value.length === 24) {
              result[key] = new mongoose.Types.ObjectId(value);
            } else if (value instanceof mongoose.Types.ObjectId) {
              result[key] = value;
            } else if (typeof value === 'object' && value !== null && value.constructor === Object) {
              result[key] = ensureObjectIds(value);
            } else {
              result[key] = value;
            }
          }
        }
        return result;
      }
      
      return obj;
    };
    
    const processedConfig = ensureObjectIds(config);
    console.log("Step 6 SUCCESS: ObjectIds converted");
    logger.info("Step 6 SUCCESS: ObjectIds converted");
    console.log(`Config after conversion - allowedSchools: ${JSON.stringify(processedConfig?.access?.allowedSchools)}`);
    logger.info(`Config after conversion - allowedSchools: ${JSON.stringify(processedConfig?.access?.allowedSchools)}`);
    if (processedConfig?.access?.allowedSchools && Array.isArray(processedConfig.access.allowedSchools) && processedConfig.access.allowedSchools.length > 0) {
      console.log(`First school ID after conversion: ${processedConfig.access.allowedSchools[0]}`);
      logger.info(`First school ID after conversion: ${processedConfig.access.allowedSchools[0]}`);
      console.log(`First school ID type after: ${typeof processedConfig.access.allowedSchools[0]}`);
      logger.info(`First school ID type after: ${typeof processedConfig.access.allowedSchools[0]}`);
      console.log(`Is ObjectId after: ${processedConfig.access.allowedSchools[0] instanceof mongoose.Types.ObjectId}`);
      logger.info(`Is ObjectId after: ${processedConfig.access.allowedSchools[0] instanceof mongoose.Types.ObjectId}`);
    }
    
    console.log("Step 7: Calling aggregateViewData");
    logger.info("Step 7: Calling aggregateViewData");
    const sectionsEnabled = {
      schools: processedConfig?.sections?.schools?.enabled,
      tutors: processedConfig?.sections?.tutors?.enabled,
      students: processedConfig?.sections?.students?.enabled,
      cohorts: processedConfig?.sections?.cohorts?.enabled,
      assessments: processedConfig?.sections?.assessments?.enabled,
      progress: processedConfig?.sections?.progress?.enabled,
      attendance: processedConfig?.sections?.attendance?.enabled,
    };
    console.log(`Processed config sections enabled: ${JSON.stringify(sectionsEnabled)}`);
    logger.info(`Processed config sections enabled: ${JSON.stringify(sectionsEnabled)}`);
    
    console.log("Step 7.1: About to call aggregateViewData...");
    const data = await aggregateViewData(processedConfig);
    console.log("Step 7.2: aggregateViewData returned successfully");
    
    console.log("Step 7 SUCCESS: Data aggregated");
    logger.info("Step 7 SUCCESS: Data aggregated");
    console.log(`Aggregated data keys: ${Object.keys(data || {}).join(', ')}`);
    logger.info(`Aggregated data keys: ${Object.keys(data || {}).join(', ')}`);

    console.log("Step 8: Sending response");
    logger.info("Step 8: Sending response");
    res.json({
      viewId: view._id,
      viewName: view.name,
      data,
    });
    console.log("Step 8 SUCCESS: Response sent");
    logger.info("Step 8 SUCCESS: Response sent");
    console.log("========== getMyViewData FUNCTION COMPLETED SUCCESSFULLY ==========\n");
    logger.info("========== getMyViewData FUNCTION COMPLETED SUCCESSFULLY ==========\n");
    
  } catch (error: any) {
    console.error("\n========== getMyViewData ERROR CAUGHT ==========");
    logger.error("\n========== getMyViewData ERROR CAUGHT ==========");
    console.error("Step ERROR: Exception occurred");
    logger.error("Step ERROR: Exception occurred");
    console.error(`Error name: ${error.name}`);
    logger.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    logger.error(`Error message: ${error.message}`);
    console.error(`Error kind: ${error.kind}`);
    logger.error(`Error kind: ${error.kind}`);
    console.error(`Error path: ${error.path}`);
    logger.error(`Error path: ${error.path}`);
    console.error(`Error value: ${error.value}`);
    logger.error(`Error value: ${error.value}`);
    console.error(`Error stack: ${error.stack}`);
    logger.error(`Error stack: ${error.stack}`);
    console.error("===============================================\n");
    logger.error("===============================================\n");
    
    // Log detailed error information - use both console.error and logger
    const errorDetails = {
      name: error.name,
      message: error.message,
      kind: error.kind,
      value: error.value,
      path: error.path,
      stack: error.stack,
    };
    
    logWithViewInfo("Error fetching user's view data:", undefined, error);
    logger.error("Full error details:", errorDetails);
    
    res.status(500).json({ 
      error: "Failed to fetch view data",
      details: error.message,
      kind: error.kind,
      path: error.path,
      value: error.value,
    });
  }
};

/**
 * Activate/Deactivate a view user
 * Only super_admin can activate/deactivate views
 */
export const activateView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }

    const view = await View.findById(id);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    view.viewUser.isActive = isActive;
    await view.save();

    // Update Firebase user disabled status
    try {
      await auth.updateUser(view.viewUser.uid, {
        disabled: !isActive,
      });
      logWithViewInfo(
        `View user ${isActive ? "activated" : "deactivated"}`,
        view
      );
    } catch (firebaseError: any) {
      logWithViewInfo(
        `Failed to update Firebase user: ${firebaseError.message}`,
        view
      );
    }

    // Update MongoDB user isActive status
    try {
      await User.findOneAndUpdate(
        { uid: view.viewUser.uid },
        { isActive: isActive }
      );
    } catch (mongoError: any) {
      logWithViewInfo(
        `Failed to update MongoDB user: ${mongoError.message}`,
        view
      );
    }

    res.json({
      id: view._id,
      viewUser: {
        email: view.viewUser.email,
        isActive: view.viewUser.isActive,
      },
    });
  } catch (error: any) {
    logWithViewInfo("Error activating/deactivating view:", error);
    res.status(500).json({ error: "Failed to update view status" });
  }
};
