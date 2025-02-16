class APIController {
    constructor() {
        this.xhttp = new XMLHttpRequest();
        this.outputController = new OutputController();
        this.baseUrl = "https://stingray-app-58zyk.ondigitalocean.app/api/v1/sql";
    }

    // Sends the INSERT statement to server
    sendINSERTQuery(query) {
        this.xhttp.open("POST", this.baseUrl, true);
        this.xhttp.setRequestHeader("Content-Type", "application/json");
        const requestData = JSON.stringify({ query: query });
        this.xhttp.send(requestData);   
        this.xhttp.onreadystatechange = () => { 
            if (this.xhttp.readyState === 4) {
                const response = JSON.parse(this.xhttp.responseText);
                if (response.status === "success" && this.xhttp.status === 201) {
                    this.outputController.displayRowsAffected(response.data.rows_affected);
                } else {
                    this.outputController.displayErrorOutput(this.xhttp.status, response.status, response.message)
                }
            }
        };
    }

    // Sends the SELECT statement to server
    sendSELECTQuery(query) {
        const encodedQuery = encodeURIComponent(query); // Encode query for URL safety
        this.xhttp.open("GET", this.baseUrl + "?query=" + encodedQuery, true);
        this.xhttp.setRequestHeader("Content-Type", "x-www-form-urlencoded");
        this.xhttp.send();
        this.xhttp.onreadystatechange = () => {
            if (this.xhttp.readyState === 4) {
                const response = JSON.parse(this.xhttp.responseText);
                if (response.status === "success" && this.xhttp.status === 200) {
                    this.outputController.displayTable(response.items);
                } else {
                    this.outputController.displayErrorOutput(this.xhttp.status, response.status, response.message);
                }
            }
        };
    }

    // Sends the INSERT statement to server with a dummy data
    insertDummyData() {
        const query = `INSERT INTO patient (name, dateOfBirth) VALUES
                                            ('Sara Brown', '1901-01-01'),
                                            ('John Smith', '1941-01-01'),
                                            ('Jack Ma', '1961-01-30'),
                                            ('Elon Musk', '1999-01-01');`;
        this.sendINSERTQuery(query);
    }
}

class OutputController {

    // Deletes everything from output field
    emptyOutputField() {
        document.getElementById("outputStatus").innerHTML = "";
        document.getElementById("outputMsg").innerHTML = "";
        document.getElementById("outputTable").innerHTML = "";
    }

    // Inserts error pop up
    insertErrorPopup(errorMsg) {
        document.getElementById("errorPopupWrap").style.opacity = "1";
        document.getElementById("errorPopupWrap").style.visibility = "visible";
        document.getElementById("errorMsg").innerHTML = errorMsg;
    }

    // Displays the error output
    displayErrorOutput(status, statusMsg, outputMsg) {
        this.emptyOutputField();
        document.getElementById("outputStatus").innerHTML = messages.outputStatus.replace("%1", status).replace("%2", statusMsg);
        document.getElementById("outputMsg").innerHTML = outputMsg;
    }

    // Displays GET error output
    displayRowsAffected(numOfRows) {
        this.emptyOutputField();
        document.getElementById("outputStatus").innerHTML = messages.insertSuccess;
        document.getElementById("outputMsg").innerHTML = messages.numOfRowsAffected.replace("%1", numOfRows);
    }

    // Displays the table retrived from GET request
    displayTable(tableData) {    
        // Extract the column names dynamically from the first object
        const columnNames = Object.keys(tableData[0]);
    
        let table = `<table><thead><tr>`;
        
        // Dynamically create table headers
        columnNames.forEach(column => {
            table += `<th>${column}</th>`;
        });
    
        table += `</tr></thead><tbody>`;
    
        // Dynamically create table rows
        tableData.forEach(row => {
            table += `<tr>`;
            columnNames.forEach(column => {
                table += `<td>${row[column] !== undefined ? row[column] : ""}</td>`;
            });
            table += `</tr>`;
        });
    
        table += `</tbody></table>`;
    
        this.emptyOutputField();
        document.getElementById("outputTable").innerHTML = table;
    }

}

class InputValidator {
    // Grabs the first word of query
    grabFirstKeyword(query) {
        return query.trim().split(/\s+/)[0].toUpperCase(); 
    }

    // Checks if input is empty
    isEmpty(value) {
        return !value || value.trim() === "";
    }

    // Checks if input is a SELECT statement
    isSelect(value) {
        return value.toUpperCase().includes("SELECT");
    }

    // Checks if input is an INSERT statement
    isInsert(value) {
        return value.toUpperCase().includes("INSERT");
    }

    // Validates input
    validateInput(value) {
        if (this.isEmpty(value)) return messages.inputIsEmpty;
        if (!this.isSelect(value) && !this.isInsert(value)) return messages.inputIsNotValid;
        return true;
    }
}

class ButtonActions {
    constructor() {
        this.inputValidator = new InputValidator();
        this.apiController = new APIController();
    }

    // For the "Add" button that inserts dummy data to the server
    addDummyData(e) {
        e.preventDefault();
        this.apiController.insertDummyData();
    }

    // For the "Run Statement" button to send SQL statements to the server
    runSQLStatement(e) {
        e.preventDefault();
        const userInput = document.getElementById("queryInput").value;
        const statementRequest = this.inputValidator.grabFirstKeyword(userInput);
        const validatedInput = this.inputValidator.validateInput(statementRequest);
        if (validatedInput != true) {
            this.apiController.outputController.insertErrorPopup(validatedInput);
            return;
        }
        if (this.inputValidator.isSelect(statementRequest)) {
            this.apiController.sendSELECTQuery(userInput);
            return;
        }
        if (this.inputValidator.isInsert(statementRequest)) {
            this.apiController.sendINSERTQuery(userInput);
            return;
        }
    }

    // For the close button inside error popup
    closeErrorPopup() {
        document.getElementById("errorPopupWrap").style.opacity = "0";
        document.getElementById("errorPopupWrap").style.visibility = "hidden";
    }
}

class UI {
    constructor() {
        this.buttonActions = new ButtonActions();
        this.init();
    }

    // Initializes UI
    init() {
        this.initTitles();
        this.initButtons();
    }

    // Inserting title strings
    initTitles() {
        document.getElementById("addDummyDataTitle").innerHTML = messages.insertDummyDataTitle;
        document.getElementById("enterStatementTitle").innerHTML = messages.enterStatementTitle;
        document.getElementById("outputTitle").innerHTML = messages.outputTitle;
    }

    // Initializing buttons
    initButtons() {
        document.getElementById("addDummyDataBtn").innerHTML = messages.addDummyDataBtn;
        document.getElementById("addDummyDataBtn").addEventListener("click", (e) => this.buttonActions.addDummyData(e));

        document.getElementById("queryBtn").innerHTML = messages.runStatementBtn;
        document.getElementById("queryBtn").addEventListener("click", (e) => this.buttonActions.runSQLStatement(e));

        document.getElementById("closeErrorPopupBtn").innerHTML = messages.closeErrorPopup;
        document.getElementById("closeErrorPopupBtn").addEventListener("click", () => this.buttonActions.closeErrorPopup())
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new UI();
});