/* This function is responisble for calling the generate model api */
function generateModel() {
    const model_id = "1";
    var generateModelUrl = '/generate-model/' + model_id;
    $.ajax({
        url: generateModelUrl,
        type: 'POST',
        dataType: 'JSON',
        success: (result) => {
            if (result.status === 200) {
                alert(result.status);
            } else if (result.status === 400) {
                alert(result.failed);
            }
        }
    });
}

function updateTextArea(data) {
    const { _id, model_id, document_name, plain_text, tokenized_text } = data;

    var builtText = "";

    //Gets the avaliable entity selections from the webpage. Need the Value and Colour value from them
    var entityColours = document.getElementById("entitySelect").children;
    console.log(entityColours);
    //For each element in the tokenized text document we need to loop through them and assign
    //a highlighted colour if they have been annotated
    tokenized_text.forEach(element => {

        //Loop through the entity elements from the html page
        for (var i = 0; i < entityColours.length; i++) {
            if (element.value == entityColours[i].getAttribute("value")) {

                //Sets the background of the word, to the colour attribted to the entity
                builtText += ` <i style='background-color:#${entityColours[i].getAttribute("colour")};'>${element.id}</i>`;
                break; //Only needs to be set once, so break from loop once set

                //If no entity is set, just set it plainl
                // TODO: Make this a conditional before starting loop - speed up the process
            } if (i === entityColours.length - 1) {
                builtText += (" " + element.id);
            }
        }
    });

    result =
        //TODO: change this all to appending to the DOM instead of hard coded
        `<div> 
            <h4 class="text-center" id="docName" value=${_id}>${document_name}</h4>
            <br />
            <p id="textDisplayed">${builtText}</p>
        </div>`;
    document.getElementById('documentTextArea').innerHTML = result;
}

/* Attached to the match button. WIll fire when someone wants to assign an entity to a word */
function match() {
    if (!document.getElementById("docName")) {
        alert("Please choose a document first");
    } else if (document.getElementById("word").value === '') {
        alert("Please pick a word to assign an entity to");
    } else {




        
        //Get the words that have been input by the user
        var wordList = document.getElementById("word").value.match(/[-+]?[0-9]\.?[0-9]+|\w+|\S/g);

        // It is easier to create an object of everything that will be used in the API here
        var data = {
            docID: document.getElementById("docName").getAttribute("value"),
            docName: document.getElementById("docName").innerHTML,
            word: wordList,
            value: document.getElementById("entitySelect").value,
        }

        var postDataUrl = '../update/entity/' + data.docID + '/' + data.wordList + '/' + data.value;
        $.ajax({
            url: postDataUrl,
            type: 'POST',
            data: data,
            dataType: 'JSON',
            success: (result) => {
                if (result.status === 200) {
                    getDoc(data.docID);
                } else if (result.status === 400) {
                    alert(result.failed);
                }
            }
        });
    }
}

/* This function is fired on the inital page load by the browser. it will populate a list of avaluable
document avalibale to be annotated */
function getDocuments() {

    var url = '../getAllDocuments';

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'JSON',
        success: (data) => {
            console.log(data);
            //The entity list from the model is attached to the JSON object as the first element
            //Its poped off to make for easier usage
            var entityList = data.pop();

            const theTable = document.getElementById("documentTable");
            const ButtonText = "Go";

            /* For each docuemnt - We want to loop through and create an individual unique element for each. Attaching
            them ot the document table which is on the left hand side of the page*/
            data.forEach(element => {
                var newRow = document.createElement("tr");
                var newDocNameCol = document.createElement("th");
                var docName = document.createTextNode(element.document_name);
                newDocNameCol.appendChild(docName);
                newRow.appendChild(newDocNameCol);

                var newButtonNameCol = document.createElement("th");
                var newButton = document.createElement("button");
                newButton.innerHTML = ButtonText;
                newButton.id = "docButt";
                newButton.setAttribute("value", element._id);
                newButtonNameCol.appendChild(newButton);
                newRow.appendChild(newButtonNameCol);

                theTable.appendChild(newRow);
            })

            /* THe entiy list which was poped earlier, is used here to create the entity list on the right of the html page.
            It needs a value and colour attached to each entity - so they can be used again when they text from the document
            is displayed */
            const entityDropDown = document.getElementById("entitySelect");
            entityList.forEach(entity => {
                var newOption = document.createElement("option");
                newOption.id = entity.entity.toUpperCase();
                newOption.innerHTML = entity.entity.toUpperCase();
                newOption.value = entity.entity.toUpperCase();
                newOption.setAttribute("colour", entity.colour);
                entityDropDown.insertBefore(newOption, entityDropDown.firstChild);
            })
        }
    });
}

$(function () {
    $(document).on("click", '#docButt[value]', function () {
        getDoc(this.value);
    });
});

$(function () {
    $('#entitySelect').change(function () {
        console.log("here");
    })
})

/* This function is fired by the GO button - attached to each document. 
It will send a getDocument api call and updates the textfield with the returned text */
function getDoc(doc) {
    var getDataUrl = "../document/" + doc;
    $.ajax({
        url: getDataUrl,
        type: 'GET',
        dataType: 'JSON',
        success: (data) => {
            updateTextArea(data);
        }
    });
}

function createNewEntity() {
    if (document.getElementById("newEntity").value === '') {
        alert("Please enter a new entity first");
        return;
    }
    var newEntity = document.getElementById("newEntity").value.match(/[-+]?[0-9]\.?[0-9]+|\w+|\S/g);
    if (newEntity.length > 1) {
        alert("Please only enter a single word for a new entity");
        return;
    }
    var entityColour = $("#customColourPicker").spectrum("get").toHex().toUpperCase();
    addNewEntity(newEntity[0], entityColour);
}

function addNewEntity(newEntity, colour) {

    const entityDropDown = document.getElementById("entitySelect");
    console.log(newEntity);
    var newOption = document.createElement("option");
    newOption.id = newEntity.toUpperCase();
    newOption.innerHTML = newEntity.toUpperCase();
    newOption.value = newEntity.toUpperCase();
    newOption.setAttribute("colour", colour);
    entityDropDown.insertBefore(newOption, entityDropDown.firstChild);

    var newEntityUrl = "../addEntity/" + newEntity + "/" + colour;
    $.ajax({
        url: newEntityUrl,
        type: 'POST',
        dataType: 'JSON',
        success: (data) => {
            console.log(data.success);
        }
    });
}

$("#customColourPicker").spectrum({
    color: "#f00"
});

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
        document.getElementById("word").value = text;
    }
    return text;
}

document.onmouseup = document.onselectionchange = function() {
  getSelectionText();
};