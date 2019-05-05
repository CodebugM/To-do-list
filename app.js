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

// new listSchema to allow us to create new documents when the user enters a new list name
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// the next step after creating the new listSchema schema is to create a mongoose model
// as always, we put in the singular version of our collection, which is a list
// and we specify the schema, in this case the listSchema
const List = mongoose.model("List", listSchema);

// now that we have created our List model from our listSchema, we are ready to create some
//  new list documents based off this model. We are going to do that when a user puts in a
//  custom list name --> below where it says app.get("/:customListName", function(req,res){})

app.get("/", function(req, res) {

  // Step 6: Use mongoose's find() method to log all the items in our items collection
  // tap into the Item model, which represents our items collection
  // we want to find all items in our collection (i.e. there are no conditions),
  //  so we specify that using a set of curly braces - this finds us everything inside
  //  our items collection
  Item.find({}, function(err, foundItems) {

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

// create a dynamic route in express based on the route parameters, so we can access a Home and a Work list
// e.g. localhost:3000/Home and localhost:3000/Work

app.get("/:customListName", function(req,res){

  // let's save whatever the user enters after the forward slash after the web address localhost:3000 into a constant
  const customListName = req.params.customListName;

  // inside the collection of lists, find me a list with the same name as the one the user is
  //   currently trying to access
  // the callback function has two parameters, error and foundList
  //   so if there was an error, we'll print it but if there wasn't, we'll tap into what was found
  // Side note: the mongoose find() methods finds ALL items in a list and gives us an array back while the
  //   findOne() method gives us an object/document back if it is found
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      // if there were no errors, we'll check to see whether there is or there isn't a foundList
      // if foundList doesn't exist (!foundList), do X...

      if (!foundList) {
        // ** this is the path where we create a new list **
        // create a new list based off our List model, filling in the two required field
        //   the name of the new list is simply the mame the user put in
        //   the second field, "items", should accept an array of items
        //   --> we are simply going to start off with the same default array we used previously
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        // after we created our new document, all we have to do now is to save it into our lists collection
        list.save();
        // after we saved the list we need to display the list the user just created
        // we can do that by redirecting back to the CURRENT route, by concatenating the customListName at the end
        res.redirect("/" + customListName);

      } else {
        // ** this is the path where we should show an existing list **
        // here we tap into the foundList from up above in our "function(err, foundList)"
        //   we need to tap into the name and items properties of the foundList
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
}); // closing tags of app.get()



app.post("/", function(req, res){

  // When the post route is triggered, we can refer to req.body.newItem
  // This refers to the text the user enters when they click the "+" button
  //   in the list.ejs file
  // We are saving this into a constant called itemName

  const itemName = req.body.newItem;

  // now we need to create a new Item document based off my model in mongoDB

  const item = new Item ({
    name: itemName
  });

  // then we can use use the mongoose shortcut to save this item to our list
  item.save();

  // after we save our item, we reroute the page to the home route and find
  //  all the items in our items collection and render it on the screen
  res.redirect("/");

});

// add new post route that targets the /delete route
app.post("/delete", function(req, res){
  // in this post we are simply going to console log the request.body, so basically
  //   what is being sent over from our form in our list.ejs file
  const checkedItemId = req.body.checkbox;

  // we tap into the items collection using the Item model
  // only if there is a callback function can the item be deleted
  Item.findByIdAndRemove(checkedItemId, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log("Item with id " + checkedItemId + " successfully removed");
    }
  });

  res.redirect("/")

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
