// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const secretKey =
  "sk_test_51NsjSkAmLOHxUAD4tikfVEaBmbqNmu0C6EbYg6CHVYUer2XIfnoAK4PlOXTR3oy9i9NjJysP0a5v5Pj1H3Ojnz3700HA0mi2uZ";
const stripe = require("stripe")(secretKey);
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const createLocation = async () => {
  const location = await stripe.terminal.locations.create({
    display_name: "HQ",
    address: {
      line1: "Stresemannstraße 123",
      city: "Berlin",
      country: "DE",
      postal_code: "10963",
    },
  });

  return location;
};

const createReader = async (registrationCode) => {
  const location = await createLocation();
  const reader = await stripe.terminal.readers.create({
    registration_code: registrationCode,
    label: "Blue Rabbit",
    location: location.id,
  });
  return reader;
};

app.get("/", async (req, res) => {
  res.json({ msg: "HELLO" });
});

/**
 * API that adds reader to the server in order to permit client'a app access
 *    to it, by taking its generated registration code contained within the body and location.
 */
app.post("/createReader", async (req, res) => {
  try {
    const reader = await createReader(req.body.code);
    res.json({ reader_info: reader });
  } catch (error) {
    res.json({ error: error });
  }
});

/**
 * Creats payment intent with the amount specified wthin body.
 */
app.post("/startPayment", async (req, res) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
      payment_method_types: ["card_present"],
      // payment_method: "pm_card_us",
      capture_method: "automatic_async",
    });
    res.json({ payment_intent: intent });
    console.log("made intent");
  } catch (err) {
    res.json({ err: err });
  }
});

// The ConnectionToken's secret lets you connect to any Stripe Terminal reader
// and take payments with your Stripe account.
// Be sure to authenticate the endpoint for creating connection tokens.
app.post("/connectionToken", async (req, res) => {
  console.log("REACHED THE ENDPOINT");
  try {
    let connectionToken = await stripe.terminal.connectionTokens.create();
    res.json({ secret: connectionToken.secret });
  } catch (error) {
    res.json({ error: error });
  }
});

app.post("/cancelIntent", async (req, res) => {
  try {
    const intentCanceledResponse = await stripe.paymentIntents.cancel(
      req.body.intentId
    );
    res.json({ canceled_intent: intentCanceledResponse });
  } catch (error) {
    res.json({ error: error });
  }
});

app.listen(8085, () => {
  console.log("Listening");
});
// app.post("/capturePayment", async (req, res) => {
//   const intent = await stripe.paymentIntents.capture(req.body.intentId);
//   res.json({ intent: intent });
// });

// app.post("/collectPaymentMethod", async (req, res) => {
//   const result = await terminal.collectPaymentMethod(
//     req.body.clientSecret
//   );
//   if (result.error) {
//     res.json({ errory: result });
//   } else {
//     res.json({ success: result });
//   }
// });

// app.post("/confirmPayment", async (req, res) => {
//   const result = await terminal.processPayment(req.body.intent);
//   if (result.error) {
//     res.json({ errory: result });
//   } else if (result.paymentIntent) {
//     res.json({ success: result });
//   }
// });

// createReader("simulated-wpe").then((reader) => {
//   console.log(reader);
// });
