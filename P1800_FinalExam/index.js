//import dependencies 
const express = require('express');
const path = require('path');

//setting up Express Validator -- cmd: npm install express-validator 
const {check, validationResult} = require('express-validator'); 

//set up mongoose by cmd: npm install mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bookstore', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//setting up my order info
const Order = mongoose.model('Order',{
    name: String,
    sNumber: Number,
    
    html5: Number,
    css3: Number,
    pens: Number,

    subTotal: Number,
    tax: Number,
    total: Number

})

// set up variables to use packages  -- cmd: npm install express
var myApp = express();
myApp.use(express.urlencoded({extended:false})); // new way after Express 4.16

//set up views and public folders
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public')); 
myApp.set('view engine', 'ejs');

//home page
myApp.get('/', function(req, res){
    res.render('home');
});

//defining regular expressions
var studentNumRegex = /^[0-9]{7}$/;
var posNumRegex = /^(0|[1-9][0-9]{0,9})$/;

var products = [
    ["html5",           62.99,         0],
    ["css3",            51.99,         0],
    ["pens",            2.99,         0]
]
;


//function to check a value using regular expression
function checkRegex(userInput, regex){
    if(regex.test(userInput)){
        return true;
    }
    else{
        return false;
    }
}

function customStudentNumValidation(value){
    if(!checkRegex(value, studentNumRegex)){
        throw new Error('Student number needs to be a 7 digit number.');
    }
    return true;
}

function customOrderValidation(value){
    if(!checkRegex(value, posNumRegex)){
        throw new Error('Product number needs to be a positive number.');
    }
    return true;
}

myApp.post('/', [
    check('name', 'Please enter a name').notEmpty(),
    check('sNumber', 'Please enter a 7 digit student number').custom(customStudentNumValidation),

    check('html5').custom(customOrderValidation),
    check('css3').custom(customOrderValidation),
    check('pens').custom(customOrderValidation)
    
],function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){

        res.render('home', {
            errors:errors.array()
        });
        
    }
    else{
        //customer info
        var name = req.body.name;

        var sNumber = req.body.sNumber;

        //product-purchase info sale
        var html5 = req.body.html5;
        var css3 = req.body.css3;
        var pens = req.body.pens;

        var totalProductsPicked = parseInt(html5 + css3 + pens);

        //calc sub totals
        var subTotal = 0;
        subTotal = GetItemCost("html5", html5) + GetItemCost("css3", css3) + GetItemCost("pens", pens);

        //get tax info
        var taxRate = .13; 

        var tax = subTotal * taxRate;
        var total = subTotal + tax;

        if(totalProductsPicked >= 1)
        {
            var pageData = {
                name : name,

                sNumber: sNumber,

                //book store items
                html5 : html5,
                html5Tot : GetItemCost("html5", html5),
                css3 : css3,
                css3Tot : GetItemCost("css3", css3),
                pens : pens,
                pensTot : GetItemCost("pens", pens),

                //totals
                subTotal : subTotal,
                tax : tax,
                total : total

            }

            //create object
            var myOrder = new Order(pageData);

            //save order
            myOrder.save().then(function(){
                console.log("New order created");
            });

            //display
            res.render('ordersuccess', pageData);
        }
        else{
            res.render('home', {error2:"ERROR, you must purchase at least one product"});
        }

    }
    
});

function GetItemCost(prodPicked, amt)
{
    let dollarAmt = 0;
    for(let i = 0; i < products.length; i++)
    {
        if(prodPicked == products[i][0])
        {
            dollarAmt = parseFloat(products[i][1]) * amt;
            return dollarAmt;
        }
    }
    return dollarAmt;
}

// All orders page
myApp.get('/allorders',function(req, res){
    Order.find({}).exec(function(err, orders){
        res.render('allorders', {orders:orders});
    });
        
});

//listen to port 8080 because i say so
myApp.listen(8080);
console.log('Everything executed fine.. Open http://localhost:8080/');