import { feature, product, featureItem, pricedFeatureItem, priceItem } from "atmn";

// Features
export const premium_support = feature({
  id: "premium_support",
  name: "Premium Support",
  type: "boolean",
});

export const messages = feature({
  id: "messages",
  name: "Messages",
  type: "continuous_use",
});

export const api_calls = feature({
  id: "api_calls",
  name: "API Calls",
  type: "continuous_use",
});

// Products

// Free plan - Basic features with limits
export const freePlan = product({
  id: "free",
  name: "Free",
  is_default: true,
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 100,
      interval: "month",
    }),
    featureItem({
      feature_id: api_calls.id,
      included_usage: 500,
      interval: "month",
    }),
  ],
});

// Pro plan - Monthly subscription with overage pricing
export const proPlan = product({
  id: "pro",
  name: "Pro",
  items: [
    priceItem({
      price: 200,  // $200/month
      interval: "month",
    }),
    featureItem({
      feature_id: premium_support.id,
    }),
    pricedFeatureItem({
      feature_id: messages.id,
      price: 5,  // $5 per 100 messages overage
      interval: "month",
      included_usage: 1000,
      billing_units: 100,
      usage_model: "pay_per_use",
    }),
    pricedFeatureItem({
      feature_id: api_calls.id,
      price: 1,  // $1 per 1000 API calls overage
      interval: "month",
      included_usage: 5000,
      billing_units: 1000,
      usage_model: "pay_per_use",
    }),
  ],
});

// Enterprise plan - Annual billing with higher limits
export const enterprisePlan = product({
  id: "enterprise",
  name: "Enterprise",
  items: [
    priceItem({
      price: 1000,  // $1000/year
      interval: "year",
    }),
    featureItem({
      feature_id: premium_support.id,
    }),
    pricedFeatureItem({
      feature_id: messages.id,
      price: 3,  // $3 per 100 messages overage (discounted)
      interval: "month",
      included_usage: 10000,
      billing_units: 100,
      usage_model: "pay_per_use",
    }),
    pricedFeatureItem({
      feature_id: api_calls.id,
      price: 0.5,  // $0.50 per 1000 API calls overage (discounted)
      interval: "month",
      included_usage: 50000,
      billing_units: 1000,
      usage_model: "pay_per_use",
    }),
  ],
});

export default {
  products: [freePlan, proPlan, enterprisePlan],
  features: [premium_support, messages, api_calls],
};

