import express from 'express';
import Subscription from '../models/Subscription.js';
import ParkingLot from '../models/ParkingLot.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Plan limits configuration
const PLAN_LIMITS = {
  basic: {
    maxMotorcycles: 50,
    monthlyFee: 29.99,
    features: ['basic'],
  },
  premium: {
    maxMotorcycles: 200,
    monthlyFee: 79.99,
    features: ['basic', 'advanced_reports', 'priority_support'],
  },
  enterprise: {
    maxMotorcycles: 9999,
    monthlyFee: 199.99,
    features: ['basic', 'advanced_reports', 'priority_support', 'api_access', 'customization'],
  },
};

// Get current subscription (owner)
router.get('/current', authenticate, tenantIsolation, async (req, res) => {
  try {
    if (!req.parkingLotId) {
      return res.status(404).json({
        success: false,
        message: 'No parking lot assigned',
      });
    }

    const subscription = await Subscription.findOne({
      parkingLotId: req.parkingLotId,
      status: 'active',
    }).sort({ createdAt: -1 });

    const parkingLot = await ParkingLot.findById(req.parkingLotId);

    if (!subscription && parkingLot) {
      // Return trial/default subscription info
      return res.json({
        success: true,
        subscription: {
          planType: parkingLot.subscriptionPlan,
          status: parkingLot.subscriptionStatus,
          maxMotorcycles: parkingLot.maxMotorcycles,
          monthlyFee: parkingLot.monthlyFee,
          subscriptionEndDate: parkingLot.subscriptionEndDate,
          isTrial: parkingLot.subscriptionStatus === 'trial',
        },
        planLimits: PLAN_LIMITS[parkingLot.subscriptionPlan] || PLAN_LIMITS.basic,
      });
    }

    res.json({
      success: true,
      subscription,
      planLimits: PLAN_LIMITS[subscription?.planType] || PLAN_LIMITS.basic,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message,
    });
  }
});

// Create/Update subscription (admin only)
router.post('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { parkingLotId, planType, monthlyFee, startDate, endDate } = req.body;

    if (!parkingLotId || !planType) {
      return res.status(400).json({
        success: false,
        message: 'parkingLotId and planType are required',
      });
    }

    const planLimits = PLAN_LIMITS[planType] || PLAN_LIMITS.basic;
    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const subscriptionEndDate = endDate ? new Date(endDate) : (() => {
      const date = new Date(subscriptionStartDate);
      date.setMonth(date.getMonth() + 1);
      return date;
    })();

    // Update parking lot
    const parkingLot = await ParkingLot.findByIdAndUpdate(
      parkingLotId,
      {
        subscriptionPlan: planType,
        subscriptionStatus: 'active',
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: subscriptionEndDate,
        monthlyFee: monthlyFee || planLimits.monthlyFee,
        maxMotorcycles: planLimits.maxMotorcycles,
      },
      { new: true }
    );

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: 'Parking lot not found',
      });
    }

    // Create or update subscription
    let subscription = await Subscription.findOne({
      parkingLotId,
      status: 'active',
    });

    if (subscription) {
      subscription.planType = planType;
      subscription.monthlyFee = monthlyFee || planLimits.monthlyFee;
      subscription.startDate = subscriptionStartDate;
      subscription.endDate = subscriptionEndDate;
      subscription.status = 'active';
      await subscription.save();
    } else {
      subscription = new Subscription({
        parkingLotId,
        planType,
        monthlyFee: monthlyFee || planLimits.monthlyFee,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        status: 'active',
      });
      await subscription.save();
    }

    res.json({
      success: true,
      subscription,
      parkingLot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message,
    });
  }
});

// Cancel subscription
router.put('/cancel', authenticate, tenantIsolation, async (req, res) => {
  try {
    if (!req.parkingLotId) {
      return res.status(404).json({
        success: false,
        message: 'No parking lot assigned',
      });
    }

    const subscription = await Subscription.findOne({
      parkingLotId: req.parkingLotId,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found',
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = req.body.reason || 'User cancelled';
    await subscription.save();

    // Update parking lot
    await ParkingLot.findByIdAndUpdate(req.parkingLotId, {
      subscriptionStatus: 'cancelled',
    });

    res.json({
      success: true,
      message: 'Subscription cancelled',
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message,
    });
  }
});

// Get all subscriptions (admin)
router.get('/all', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { status, planType } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (planType) filter.planType = planType;

    const subscriptions = await Subscription.find(filter)
      .populate('parkingLotId', 'nombre ownerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message,
    });
  }
});

// Get plan limits
router.get('/plans', async (req, res) => {
  res.json({
    success: true,
    plans: PLAN_LIMITS,
  });
});

export default router;
