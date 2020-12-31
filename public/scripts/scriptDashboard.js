//######################## Dashboard Script ########################


//Variable for storing user nutrition and other defaults for use in script
let userPreferences = {};
const nutritionOptions = ["caffeine", "calcium", "calories", "carbs", "chloride", "choline", "cholesterol", "chromium", "copper", "fat", "fiber", "folic acid", "histidine",
"iodine", "iron","isoleucine", "leucine", "lysine", "magnesium", "manganese", "methionine", "molybdenum","phenylalanine", "phosphorus", "potassium", "protein",
"saturated fat", "selenium", "sodium", "sugar", "trans fat", "threonine", "tryptophan", "valine", "vitamin a", "vitamin b1", "vitamin b2", "vitamin b3",
"vitamin b5", "vitamin b6", "vitamin b7", "vitamin b9", "vitamin b12", "vitamin c", "vitamin d2", "vitamin d3", "vitamin e", "vitamin k", "zinc"]

//When page loads
$(window).on("load",()=>{
    //Store user nutrition info in window from DOM 
    userPreferences = $("#goals").data().userpreferences;
})

//######################## Functions ########################
const orderAlphabetically = function(startingPoint, unorderedArray){
    let valueChanged = false;
    while(valueChanged === false){
        valueChanged = true;
        for(let i=startingPoint; i<=unorderedArray.length; i++){
            //end loop if nothing left to compare
            if(unorderedArray[i+1] == undefined){
            break
            }
            let obj1 = unorderedArray[i];
            let obj2 = unorderedArray[i+1];

            if(obj1 > obj2){
            let item1 = unorderedArray[i];
            let item2 = unorderedArray[i+1];
            unorderedArray.splice(i, 2, item2, item1);
            valueChanged = false;
            }
        }
    }
    return unorderedArray //now ordered alphabetically
}

//######################## Functions (Defaults Modal) ########################
//Populate top four dropdown lists on defaults modal
const setTopFourDropdownOptions = function (){
    nutritionOptions.forEach(element => {
        $("#topFourSelection1, #topFourSelection2, #topFourSelection3, #topFourSelection4")
        .append("<option value='" + element + "'>" + element + "</option>");
    });

    //set default dropdown selections
    $("#topFourSelection1").val('calories');
    $("#topFourSelection2").val('protein');
    $("#topFourSelection3").val('sodium');
    $("#topFourSelection4").val('carbs');
}

//Check for match in given array
const duplicateExists = function(array){
    let item = ""
    while(array.length > 1){
        //Remove last array item and store in item variable
        item = array.pop()
        if($.inArray(item, array) !== -1){
            return (true)
        }
    }
    //if while loop completes, no matches were found
    return(false)
}

//Populate 'Other Options' check boxes for defaults modal
const setupDefaultsCheckboxes = function(){
    //Array.from creates a copy of the array, otherwise it's just a reference
    let allOptions = Array.from(nutritionOptions);
    let topFourSelections = getTopFourSelections();

    //remove top four selections from 'allOptions' array
    topFourSelections.forEach(element => {
        let matchingIndex = allOptions.indexOf(element);

        if(matchingIndex !== -1){
        allOptions.splice(matchingIndex, 1);
        }
    });

    //remove any existing checkboxes (if the user toggles pages)
    $(".otherFlexColumn1, .otherFlexColumn2").children("div").remove();

    //populate checkboxes split into two columns
    for(i=0; i < allOptions.length; i=i+2){
        $(".otherFlexColumn1").append("<div><input type='checkbox' id='" 
        + allOptions[i] + "'name='test'></input><label for='" + allOptions[i] + "'>" + allOptions[i] + "</label></div>");

        if(allOptions[i+1] !== undefined){
            $(".otherFlexColumn2").append("<div><input type='checkbox' id='" + allOptions[i+1] 
            + "'name='test'></input><label for='" + allOptions[i+1] + "'>" + allOptions[i+1] + "</label></div>");
        }
    }
}

//Populate 'Goals' text input boxes
const setupDefaultsGoalsTextBoxes = function(){
    let list = getUserSelections();

    //order list alphabetically (keeping top four intact)
    list = orderAlphabetically(4, list);

    //remove any existing input boxes (if user toggles pages)
    $(".goalsFlexColumn1, .goalsFlexColumn2").children("div").remove();

    //populate input boxes split into two columns
    for(i=0; i < list.length; i = i+2){
        $(".goalsFlexColumn1").append("<div><label for='" + list[i].toLowerCase() + "'>" + list[i] +
         "</label><input id='" + list[i].toLowerCase() + "'type='number' inputmode='numeric' maxlength='4' min='1' pattern= '[0-9]*' required></div>")

         if(list[i+1] !== undefined){
            $(".goalsFlexColumn2").append("<div><label for='" + list[i+1].toLowerCase() + "'>" + list[i+1] +
            "</label><input id='" + list[i+1].toLowerCase() + "'type='number' inputmode='numeric' maxlength='4' min='1' pattern= '[0-9]*' required></div>")
         }

    }

}

//Get top four selected items
const getTopFourSelections = function(){
    let selections = [];
    selections.push ($("#topFourSelection1").find('option:selected').val());
    selections.push ($("#topFourSelection2").find('option:selected').val());
    selections.push ($("#topFourSelection3").find('option:selected').val());
    selections.push ($("#topFourSelection4").find('option:selected').val());

    console.log(selections)
    return(selections);
}

//Get 'other' checkbox selected items
const getOtherSelections = function(){
    let selections = [];
    $(".otherCheckBoxes :checked").each(function(){
        selections.push($(this).attr("id"));
    })
    return(selections);
}

//Get combined list of user 'top four' and 'other' selected items
const getUserSelections = function(){
    let topFourSelections = getTopFourSelections();
    let otherSelections = getOtherSelections();
    let combinesSelections = topFourSelections.concat(otherSelections);
    return(combinesSelections);
}

//Disable or enable next button on first page of defaults modal
const toggleDefaultsNextButton = function(){
    let topFourSelections = getTopFourSelections();
    let disclaimerChecked = $("#disclaimerCheckbox").prop("checked");

    //Check if disclaimer box is checked & if top four selections match
    if(duplicateExists(topFourSelections) === true || disclaimerChecked === false){
        $("#defaultsNextButton").prop("disabled", true);
    }else if(duplicateExists(topFourSelections) === false && disclaimerChecked === true){
        $("#defaultsNextButton").prop("disabled", false);
    }
}

//Get goals from text inputs
const getUserGoals = function(){
    let userGoals = {};
    let itemName = "";
    let itemValue = 0;

    $(".goalsFlexRow input").each(function(data){
            itemName = this.id;
            itemValue = $(this).val();
            userGoals[itemName] = itemValue;
    });


    return userGoals;
}

//Send user goals to server to be saved
const postDefaultSelections = function(){
    let topFourSelections = JSON.stringify(getTopFourSelections());
    let otherSelections = JSON.stringify(getOtherSelections());
    let userGoals = JSON.stringify(getUserGoals());

    $(".loadingIndicatorDiv").removeClass("hidden"); //show loading icon
    $(".defaultsTitle").prop("textContent", "Saving your preferences.");
    $(".defaultsSubTitle").prop("textContent", "Please wait...");
    $("#defaultsNextButton").prop("disabled", true);
    $("#defaultsBackButton").prop("disabled", true);

    $.ajax({
        type: 'POST',
        url: '/updateUserGoals',
        data: {
            topFourSelections: topFourSelections,
            otherSelections: otherSelections,
            userGoals: userGoals
        }

    }).done((data)=>{

        if(data.result === true){
            setTimeout(()=>{
                $(".defaultsTitle").prop("textContent", "Saved!");
                console.log(1)
            }, 3000);
            setTimeout(()=>{
                $(".defaultsTitle").prop("textContent", "Getting your account ready.");
                $(".defaultsSubTitle").prop("textContent", "Adding some food items to get you started.");
                console.log(2)
            }, 3000);
            setTimeout(()=>{
                $(".defaultsTitle").prop("textContent", "All done!");
                $(".defaultsSubTitle").prop("textContent", "What would you like to do now?");
                $(".loadingIndicatorDiv").addClass("hidden");
                //show quick tips button & get started button
                $(".defaultsFinalOptionsDiv").removeClass("hidden");
                $("#defaultsNextButton").prop("disabled", false);
                $("#defaultsBackButton").prop("disabled", false);
                console.log(3)
            }, 10000);

        }else{
            console.warn("Error saving user preferences at AJAX. - Done Catch")
            $(".loadingIndicatorDiv").addClass("hidden");
            $(".defaultsTitle").prop("textContent", "Error saving.. dang!");
            $(".defaultsSubTitle").prop("textContent", "Tap the Back button, then Submit again.");
            $("#defaultsBackButton").prop("disabled", false);
        }

    }).fail(()=>{
        console.warn("Error saving user preferences at AJAX. - Fail Catch")
        $(".loadingIndicatorDiv").addClass("hidden");
        $(".defaultsTitle").prop("textContent", "Error reaching server.. dang!");
        $(".defaultsSubTitle").html("Tap the Back button, then Submit again. <br/> Be sure to check your internet connection.");
        $("#defaultsBackButton").prop("disabled", false);
    });
}

//######################## Event Listeners (Filter and Quick Add) ########################

//Filter list items from meal selector modal based on text input.
$('#foodItemFilter').on('keyup', (doc)=>{
    let textEntered = doc.target.value;
    textEntered = textEntered.toLowerCase();
    numListItems = $('.selectableItem').length

    //If list item doesn't match inputted text, hide and remove from document flow.
    for(i=0; i<numListItems; i++){
        let singleListItem = $('#listItem'+i).text();
        singleListItem = singleListItem.toLowerCase();
        if (singleListItem.search(textEntered) == -1){
            $('#listItem'+i).css({'position':'absolute', 'visibility':'hidden'})
            //Else, place back into flow and un-hide. Handles backspace events.
        }else{
            $('#listItem'+i).css({'position':'relative', 'visibility':'visible'})
        }
    }
});


//Quick Add: Tapping 'more options' changes text to 'fewer options'
$(".moreOptionsButton").on("click",()=>{
    if($(".moreOptionsButton").text() == "more options"){
        $(".moreOptionsButton").text("fewer options");
    }else{
        $(".moreOptionsButton").text("more options");
    }
});

//######################## Event Listeners (Default Settings Modal) ########################

//Display defaults modal if no Top Four data exists
$(window).on("load", ()=>{
    if(userPreferences.nutritionTopFour.length < 1){
        $("#userPreferencesModal").modal("toggle");
        $("#defaultsBackButton").prop("disabled", true)
        setTopFourDropdownOptions();
    }
});

//Disclaimer checkbox -> enable Next button if no top four matches and disclaimer checked
$("#disclaimerCheckbox").on("click", function(){
    toggleDefaultsNextButton();
});

//Top Four drop-down -> enable Next button if no matches or disclaimer unchecked
$(".topFourSelection").on("change", ()=>{
    let topFourSelections = getTopFourSelections();
    toggleDefaultsNextButton();
    
    if(duplicateExists(topFourSelections) === true){
        $(".duplicateSelectionWarning").removeClass('hidden');
    }else{
        $(".duplicateSelectionWarning").addClass('hidden');
    }
})

//On Next button click, mimic next page
$("#defaultsNextButton").on("click", function(){
    let currentPageNumber = $(".defaultsModalBody").attr("data-page");

    if(currentPageNumber === "1"){
        //store page number in modal body
        $(".defaultsModalBody").attr("data-page", "2");
        //enable back button
        $("#defaultsBackButton").prop("disabled", false);
        //change page title
        $(".defaultsTitle").prop("textContent", "Anything else?");
        //change subtitle
        $(".defaultsSubTitle").prop("textContent", "These are optional.");
        //hide top four selectors
        $(".topFourFlexRow").addClass("hidden");
        //hide disclaimer checkbox and link
        $(".disclaimerDiv, .disclaimerLink").addClass("hidden");
        //populate checkbox options
        setupDefaultsCheckboxes();
        //show checkboxes
        $(".otherItemsFlexRow").removeClass("hidden");

    }else if(currentPageNumber === "2"){
        //store page number in modal body
        $(".defaultsModalBody").attr("data-page", "3");
        //change page title
        $(".defaultsTitle").prop("textContent", "Let's talk goals.");
        //change subtitle
        $(".defaultsSubTitle").prop("innerHTML", "Everyone's goals are different! <br> Always consult your doctor.");
        //hide checkboxes from page 2
        $(".otherItemsFlexRow").addClass("hidden");
        //get array of user's selections from first two pages
        setupDefaultsGoalsTextBoxes();
        //show goals input boxes
        $(".goalsFlexRow").removeClass("hidden");
        //change Next button text to 'Submit'
        $("#defaultsNextButton").addClass("hidden");
        $("#defaultsSubmitButton").removeClass("hidden");
        
    }else if(currentPageNumber === "4"){ //3 is handled at submit event below
        location.reload();
    }  
});

//On back button click, mimic previous page
$("#defaultsBackButton").on("click", ()=>{
    let currentPageNumber = $(".defaultsModalBody").attr("data-page");

    if(currentPageNumber === "2"){
        //store page number as class in modal body
        $(".defaultsModalBody").attr("data-page", "1");
        //disable back button
        $("#defaultsBackButton").prop("disabled", true);
        //change page title
        $(".defaultsTitle").prop("textContent", "Which nutrients are you most interested in?");
        //Change subtitle
        $(".defaultsSubTitle").prop("textContent", "These four will always be visible.");
        //show top four selectors
        $(".topFourFlexRow").removeClass("hidden");
        //show disclaimer link and checkbox
        $(".disclaimerDiv, .disclaimerLink").removeClass("hidden");
        //hide checkboxes from page 2
        $(".otherItemsFlexRow").addClass("hidden");

    }else if(currentPageNumber === "3"){
        //store page number in modal body
        $(".defaultsModalBody").attr("data-page", "2");
        //enable back button
        $("#defaultsBackButton").prop("disabled", false);
        //change page title
        $(".defaultsTitle").prop("textContent", "Anything else?");
        //change subtitle
        $(".defaultsSubTitle").prop("textContent", "These are optional.");
        //hide top four selectors
        $(".topFourFlexRow").addClass("hidden");
        //populate checkbox options
        // setupDefaultsCheckboxes();
        //show checkboxes
        $(".otherItemsFlexRow").removeClass("hidden");
        //hide goals input boxes
        $(".goalsFlexRow").addClass("hidden");
        //show Next button
        $("#defaultsNextButton").removeClass("hidden");
        //hide submit button
        $("#defaultsSubmitButton").addClass("hidden")

    }else if(currentPageNumber === "4"){
        //store page number in modal body
        $(".defaultsModalBody").attr("data-page", "3");
        //change page title
        $(".defaultsTitle").prop("textContent", "Let's talk goals.");
        //change subtitle
        $(".defaultsSubTitle").prop("innerHTML", "Everyone's goals are different! <br> Always consult your doctor.");
        //show goals input boxes
        $(".goalsFlexRow").removeClass("hidden");
        //update & show Next button
        $("#defaultsNextButton").text("Next").attr("data-dismiss", "").addClass("hidden").prop("disabled", false);
        //show submit button
        $("#defaultsSubmitButton").removeClass("hidden");
        //hide quick tips and get started buttons
        $(".defaultsFinalOptionsDiv").addClass("hidden");
    }
});

//Validate 'Submit' action on page 3 'goal' inputs
$(".defaultsForm").on("submit", (e)=>{
    e.preventDefault();
     //store page number in modal body
     $(".defaultsModalBody").attr("data-page", "4");
     //change page title
     $(".defaultsTitle").prop("textContent", "All done!");
     //change subtitle
     $(".defaultsSubTitle").prop("innerHTML", "What would you like to do now?");
    //hide goal input boxes
     $(".goalsFlexRow").addClass("hidden");
    //update next button
    $("#defaultsNextButton").removeClass("hidden");
    $("#defaultsSubmitButton").addClass("hidden");
    $("#defaultsNextButton").text("Close").prop("type", "button").attr("data-dismiss", "modal");
    //send selections to server to be saved
     postDefaultSelections();
});

$("#buttonCloseDefaults").on("click", ()=>{
    location.reload();
})

//(dev) Re-open defaults modal
$("#buttonOpenDefaultsModal").on("click", ()=>{
    $("#userPreferencesModal").modal("toggle");
    $("#defaultsBackButton").prop("disabled", true)
    setTopFourDropdownOptions();
    console.log("click")
});