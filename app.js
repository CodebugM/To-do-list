//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// Step 1: require mongoose
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Step 2: * use mongoDB and mongoose *
// create a new database inside mongoDB using mongoose.connect()
// the thing we are connecting to is the url where our mongoDB is hosted locally
// typically this url is mongodb://localhost:27017
// putting another forward slash after this address allows you to specify the
//  name of your database, like /databasename
// to avoid the deprecation warning add the flag {useNewUrlParser: true}
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// Step 3: Create a new items schema
const itemsSchema = {
  name: String
};

// Step 4: Create a new mongoose model based on the schema above
// whenever you have a mongoose model, it is usually capitalised like "Item"
// we are creating the model, passing in two arguments:
//  1) singular version of our collection name (item for a collection of items)
//  2) schema we are going to use to create this items collection
const Item = mongoose.model("Item", itemsSchema);

// Step 5: Create three new default documents using our mongoose model and add
//  them to our items collection

// we are creating a new item from our Item model, passing in our field "name"
const almondMilk = new Item ({
  name: "Buy almond milk"
});

const walk = new Item ({
  name: "Take a walk"
});

const callMum = new Item ({
  name: "Call mum"
});

// new array to hold the default items
const defaultItems = [almondMilk, walk, callMum];

app.get("/", function(req, res) {

  // Step 6: Use mongoose's find() method to log all the items in our items collection
  // tap into the Item model, which represents our items collection
  // we want to find all items in our collection (i.e. there are no conditions),
  //  so we specify that using a set of curly braces - this finds us everything inside
  //  our items collection
  Item.find({}, function(err, foundItems){

      // if there are currently no items in the collection, we want to add our
      //  default items
      if (foundItems.length === 0) {

        // use the mongoose method insertMany() to insert all these items at once
        //  into our collection; we insert 1) our array of default items, and
        //  2) a callback function
        Item.insertMany(defaultItems, function(err){
          if(err) {
            console.log(err);
          } else {
            console.log("Successfully saved items to DB.");
          }
        });
        // this simply redirects us back to our root route and checks again whether
        //  we already have items in our items collection; after we added them first
        //  it'll jump into the else fork right away
        res.redirect("/");

      // else we are not adding anything but are simply going to render list.ejs
      } else {

        // we pass over the foundItems to our list.ejs
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

  });

  // * we are simply going to render the default list with a title called "Today",
  // instead of using the date as before

});

app.post("/", function(req, res){

  const item = req.body.newItem;

  if (req.body.list === "Work") {
    workItems.push(item);
    res.redirect("/work");
  } else {
    items.push(item);
    res.redirect("/");
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
