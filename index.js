const express = require('express')
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;

const stripe = require('stripe')(process.env.STRIPE_SECRET)
// const fileUpload = require('express-fileupload')

const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())
// app.use(fileUpload())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3zfz5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();

        const database = client.db("heroRider");
        const ridersCollection = database.collection("riders");
        const learnersCollection = database.collection("learners");
        const packageCollection = database.collection("package");
        const usersCollection = database.collection("users");

        //add a user
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })

        //get all user

        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({})
            const result = await cursor.toArray();
            res.json(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true
            }
            res.json({ admin: isAdmin })
        })

        app.get("/searchEvent", async (req, res) => {
            const result = await usersCollection.find({
                '$or': [
                    { name: { $regex: req.query.search } },
                    { age: { $regex: req.query.search } },
                    { email: { $regex: req.query.search } },
                    { phone: { $regex: req.query.search } },
                ]

            }).toArray();
            res.send(result);
            console.log(result);
        });

        //add a rider
        app.post('/riders', async (req, res) => {
            const user = req.body
            const result = await ridersCollection.insertOne(user);
            res.json(result);
        })

        //get all rider

        app.get('/riders', async (req, res) => {
            const cursor = ridersCollection.find({})
            const result = await cursor.toArray();
            res.json(result)
        })

        //get a rider
        app.get('/riders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const rider = await ridersCollection.findOne(query);
            res.json(rider)
        })

        //add a learner
        app.post('/learners', async (req, res) => {
            const user = req.body
            const result = await learnersCollection.insertOne(user);
            res.json(result);
        })

        //get all learner

        app.get('/learners', async (req, res) => {
            const cursor = learnersCollection.find({})
            const result = await cursor.toArray();
            res.json(result)
        })

        //get packages
        app.get('/package', async (req, res) => {
            const cursor = packageCollection.find({})
            const result = await cursor.toArray();
            res.json(result)
        })

        app.get('/package/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await packageCollection.findOne(query);
            res.json(result);
        })


        app.put('/package/:id', async (req, res) => {
            const id = req.params.id
            const payment = req.body

            const filter = { _id: ObjectId(id) }

            const updateDoc = {
                $set: {
                    payment: payment
                },

            };
            const result = await packageCollection.updateOne(filter, updateDoc)
            res.send(result)

        })

        //srtipe payment
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']

            })
            res.json({ clientSecret: paymentIntent.client_secret })
        })

    }
    finally {
        // await client.close()
    }

}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Running Hero Rider SERVER')
})

app.listen(port, () => {
    console.log('Running Server', port);
})


