//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// Step 1: require mongoose
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Step 2: * use mongoDB and mongoose *
// create a new database inside mongoDB using mongoose.connect()
// the thing we are connecting to is the url where our mongoDB is hosted locally
// typically this url is mongodb://localhost:27017
// edit: in order to connect to our mongoDB cluster to save our data in the mongo
// Atlas cloud, we copy over the connection string our cluster specifies
// putting another forward slash after this address allows you to specify the
//  name of your database, like /databasename
// to avoid the deprecation warning add the flag {useNewUrlParser: true}
mongoose.connect("mongodb+srv://admin-marlene:test123@cluster0-ncddy.mongodb.net/todolistDB", {useNewUrlParser: true});

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
  // but instead of saving whatever the user entered we are going to capitalise the first letter using lodash
  const customListName = _.capitalize(req.params.customListName);

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
  // by adding a value attribute to the submit button in the form in our list.ejs file, we get
  //   access to the name of the list we are currently in
  // the value of req.body.list is going to be the value of the current list the user is trying
  //   to add an item to, referred to by <%= listTitle %> in the ejs file
  const listName = req.body.list;

  // now we need to create a new Item document based off my model in mongoDB
  const item = new Item ({
    name: itemName
  });

  // if we want to add an item to our today/default list, we need to handle it differently
  //   than if it was from a custom list
  // an if statement can check for that
  // if the name of the list we are currently in is "Today", we are probably in the default list
  //   - in this case we simply save the new item to our Items list and redirect to the home route
  if(listName === "Today") {
    // use the mongoose shortcut to save this item to our list
    item.save();
    // after we save our item, we reroute the page to the home route and find
    //  all the items in our items collection and render it on the screen
    res.redirect("/");
  }
  // but: if the name of our list isn't "Today" our new item comes from a custom list
  //   in that case we need to look for that list in our lists collection in our database and then
  //   save the new item to the existing array of items.
  else {
    // we are looking for a list with the name value of listName, and once we found it we use
    //   the callback function with the error and the foundList
    List.findOne({name: listName}, function(err, foundList) {
      // we can now tap into the foundList document to look for its array of items and add our new item
      // foundList.items taps into the embedded array of items from the const listSchema (lines 56-59)
      // then we use the JS push function to push a new item onto the array of items
      // the item we want to push is the one we just created of what the user typed in (line 179)
      foundList.items.push(item);
      foundList.save();

      // then we redirect to the route the user came from
      res.redirect("/" + listName);
    });
  }
});

// add new post route that targets the /delete route
app.post("/delete", function(req, res){
  // in this post we are simply going to console log the request.body, so basically
  //   what is being sent over from our form in our list.ejs file
  const checkedItemId = req.body.checkbox;
  // because of the input of type="hidden" in the list.ejs file (line 27), we can tap into the name
  //   of the list we are currently trying to delete items from
  const listName = req.body.listName;

  // like in the post request above where we save new items, we need an if statement to check
  //   whether we are in the default list or a custom list
  if (listName === "Today") {

    // we tap into the items collection using the Item model
    // Caution! Only if there is a callback function can the item be deleted
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Item with id " + checkedItemId + " successfully removed");
        res.redirect("/");
      }
    });

  } else {
  // else, if we are in a custom list the delete request comes from that custom list
  // we need to find the list document with the current listName and then update that list
  //   to remove the checked item with the particular checkedItemId
  // Because in the listSchema the items field is assigned an array, we now have to look inside
  //   the array of items for the particular item we are trying to delete

  // Instead of just relying on JavaScript we can use mongoose's $pull operator, which removes
  //   from an existing array all instances of a value or values that match a specified condition.
  // * https://docs.mongodb.com/manual/reference/operator/update/pull/ *
  // This in combination with the mongoose method fineOneAndUpadte() in order to achieve our result more effectively
  // All operators preceded by the $-sign come from mongoDB

  // we first specify the model, which corresponds to the collection we want to find one and update from
  //   inside we provide 3 things: first, the conditions of the things we want to find,
  //   second, what we want to update, and third, a callback where we get a result based on what our
  //   conditions found
  // inside the {updates} part we want to use the $pull operator as the key, and then the value
  //   has to be the field we want to pull from, so an array of something, in our case an array
  //   of items; and then for the field we need to specify which item in the array of items we
  //   actually want to pull
  // the syntax [for the update part] look like this: {$pull: {field: {_id: value}}}
  //   it is essentially saying: we want to pull from a particular array an item, and the  way
  //   we are going to find that item is through its id or through its name or whatever it is and then
  //   we have to provide the value

  // we tap into our List model and the specify three things:
  //   1) the condition: what list do we want to find - we are only going to get one back
  //   2) what updates do we want to make
  //   3) a callback function

  List.findOneAndUpdate(
    // the name of the list we are looking for is the name of our custom list
    {name: listName},
    // we have to provide the name of the array inside the list that we found
    // the items array is the only array inside our list document
    {$pull: {items: {_id: checkedItemId}}},
    // callback function
    // the findOne() in our findOneAndUpdate() function corresponds to finding a list
    function (err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});





app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
