//########### Edit Items Script ###########

// Functions #############################################################################################

//Get Item Values from DB
const getItemValues = function(itemId){
    return new Promise((resolve, reject)=>{
        $.ajax({
            method:"GET",
            url:"./getItemValues",
            data: {itemId: itemId},
            success: (data)=>{
                resolve(data.data);
            }
        }).done(()=>{
        });
    })
};

//Set Item Values in Edit Item Modal
const setItemValues = function(itemId){
    getItemValues(itemId).then((foodItemValues)=>{
        //Get list of all text boxes in modal
        let textBoxesArray = $(".editItemTextBoxGeneral, .editItemTextBoxTopFour").toArray();

        textBoxesArray.forEach(element => {
            //Get id of each box element (fat, protein, etc)
            let itemId = element.id;
            //Update each text box value with value from DB
            $("#"+itemId).val(foodItemValues[itemId])
            //and the placeholder text
            .attr("placeholder",foodItemValues[itemId]);;
        });
        //hide loading indicator and enable text input
        //timeout to display indicator for minimum time
        setTimeout(function(){
            $(".loadingIndicatorDiv").addClass("hideElement");
            $(".editItemTextBoxGeneral, .editItemTextBoxTopFour, #nameOfItem, #deleteButton").prop("disabled", false)
        }, 500)
    });
};

//Set Item Name in Edit Item Modal
const setItemName = function(itemName){
    $("#nameOfItem").val(itemName).attr("placeholder", itemName)
}

//Store itemId in delete button for deletion use and reset button values
const setDeleteButton = function(itemId){
    $("#deleteButton").attr("data-itemId", itemId);
    $("#deleteButton").prop("textContent", "Delete");
}

const setSaveButton = function(){
    $("#saveButton").prop("textContent", "Save");
};

//Convert array of key value pairs into one object.
const arrayToObject = function(array){
    let itemObject = {};

    array.forEach((element)=>{
        itemObject[element.name] = element.value;
    });

    return(itemObject);
};

//Get form data and convert to JSON object for Ajax post
const getFormData = function(){
    let formArray = $('#editItemForm').serializeArray();
    let formObject = arrayToObject(formArray);
    let jsonObject = JSON.stringify(formObject);
    return(jsonObject);
};

// Event Handlers #############################################################################################

//Respond to food item click
$(".singleItem").on("click", (data)=>{
    let selectionName = data.currentTarget.innerHTML;
    let itemId = data.currentTarget.dataset.itemid;
    //Disable text input and show loading indicator
    $(".editItemTextBoxGeneral, .editItemTextBoxTopFour, #nameOfItem, #saveButton, #deleteButton").prop("disabled", true)
    $(".loadingIndicatorDiv").removeClass("hideElement");
    //Store item _id in form for use when submitting
    $("#editItemForm").attr("data-ItemId", itemId);
    setItemValues(itemId);
    setItemName(selectionName);
    setDeleteButton(itemId);
    setSaveButton();
});

//Respond to delete click
$("#deleteButton").on("click", (data)=>{
    let itemId = data.currentTarget.dataset.itemid;

    if($("#deleteButton").prop("textContent") === "Are You Sure?"){
        $("#deleteButton").prop("disabled", true);

        //Delete item from DB based on item's _id
        $.ajax({
            type: "POST",
            url: "./deleteFoodItem",
            data: {itemId:itemId},
        }).done((data)=>{
            //if deletion is successful or fails
            if(data.result == true){
                location.reload({forceReload:true});
            }else{
                $("#deleteButton").prop("textContent", "Error");
            }
        })

    }else{
        $("#deleteButton").prop("textContent", "Are You Sure?");
    }
});

//Respond to edit modal text box changes
$(".editItemTextBoxGeneral, .editItemTextBoxTopFour, #nameOfItem").on("input", (data)=>{
    //Enable save button
    $("#saveButton").prop({"disabled": false, "textContent":"Save"});
});

//Respond to save button click
$("#editItemForm").on("submit", (data)=>{
    data.preventDefault();
    
    $("#saveButton, #deleteButton").prop("disabled", true)
    $("#saveButton").prop("textContent", "Saving...")

    let itemId = data.currentTarget.dataset.itemid;
    let itemData = getFormData();

    $.ajax({
        type: "POST",
        url: "./updateFoodItem",
        data: {itemData:itemData, itemId:itemId}
    }).done((data)=>{

        //If update was successful/failed
        if(data.result === true){
            $("#saveButton").prop("textContent", "Saved!")
            $("#saveButton").css("background-color", "limegreen")

            setTimeout(() => {
                location.reload({forceReload:true});
            }, 300);
        }else{
            $("#saveButton").prop("textContent", "Error Saving")
        }
    })
});

//Highlight selected item from Item Editor list
$(".singleItem").on("click", function(){
    $(this).css("background-color", "#e7f3ff")
    setTimeout(()=>{
        $(this).css("background-color", "transparent")
    }, 200)
});