/**
 * Created by palmour on 9/20/16
*/
var db;
var survey_result;
var DOMAIN = "http://master-caterpillars.vipapps.unc.edu";

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    
    document.addEventListener("backbutton", function(e){
        db.close();
        e.preventDefault();
        window.location.assign("homepage.html");
    }, false);

    db=window.sqlitePlugin.openDatabase(
        {name: 'app.db', location: 'default'}, 
        DBSuccessCB(), 
        function(error){alert("Error Open Database:"+JSON.stringify(error));}
    );
    function DBSuccessCB(){
        // alert("DB open OK");

    }

    populateSurveyList();
}

function populateSurveyList() {
    db.transaction(function(tx){
        tx.executeSql('select * from SURVEY', [], function(tx, rs){
            if(rs.rows.length>0) {
                survey_result = rs.rows;
            } else {
                // alert("survey database empty");
                survey_result = [];
            }
        });

    }, function(error){
        alert("Transaction error: "+error.message);
    }, function(){
        // alert("successfully retrieved pending surveys");
        var list_content="";
        for(var i=0; i<survey_result.length; i++){
            var row = survey_result.item(i);
            var new_list_item = '<li class="survey_item"><h5>Site: '+row.siteID+'</h5><h5>Circle: '+row.circle+
            '</h5><h5>Survey: '+row.survey+'</h5><h5>Time: '+row.timeStart+'<h5>id: </h5>'+
            '<div class="survey_delete text-center white-text"> Delete this Survey</div></li><hr>';

            list_content += new_list_item;
        }

        $(".survey_list").html(list_content);
        numSurveys();
    });
}

$(document).ready(function(){
    numSurveys();

    var $submitButton = $(".upload-button");
    $submitButton.click(function(e) {
        e.preventDefault();
        var ask = window.confirm("Ready to upload?");
        if (ask) {
            for (var i = 0; i< survey_result.length; i++){
                var survey = survey_result.item(i);
                // alert("trying to submit " + survey.siteID);
                submitSurveyToServer(i, survey);
                // alert("finish submitting #" + i);
            }
    }else{
        window.alert("Upload unsuccessfully");
    }   
   });

});

function numSurveys(){
    var $list_length = $(".survey_item").length; //computes number of items in the survey list
    $(".survey-count").html("Total Stored Survey: " + $list_length); //updates survey-count
}

function deleteSurvey(survey) {
    db.transaction(function (tx) {

        var query = "DELETE FROM SURVEY WHERE siteID = ? AND timeStart = ?";

        tx.executeSql(query, [survey.siteID, survey.timeStart], function (tx, res) {
        },
        function (tx, error) {
            alert('DELETE error: ' + error.message);
        });
    }, function (error) {
        alert('transaction error: ' + error.message);
    }, function () {
        // alert("deleted survey " + survey.siteID);
        populateSurveyList();
    });
}

function recordErrorCode(survey, errorCode) {
    db.transaction(function (tx) {
        var query = "UPDATE SURVEY SET ErrorCode = ? WHERE siteID = ? AND timeStart = ?";

        tx.executeSql(query, [errorCode, survey.siteID, survey.timeStart], function (tx, res) {
        },
        function (tx, error) {
            alert('UPDATE error: ' + error.message);
        });
    }, function (error) {
        alert('transaction error: ' + error.message);
    }, function () {
        alert("update survey " + survey.siteID + "with error status: " + errorCode);
    });
}

function submitSurveyToServer(i, survey) {
    $.ajax({
        url: DOMAIN + "/api/submission_full.php",
        type : "POST",
        crossDomain: true,
        dataType: 'json',
        data: JSON.stringify({
            "type" : "survey",
            "siteID" : survey.siteID,
            "userID" : survey.userID,
            "password" : survey.password,
            //survey
            "circle" : survey.circle,
            "survey" :  survey.survey,
            "timeStart" :  survey.timeStart,
            "temperatureMin" : survey.temperatureMin,
            "temperatureMax" : survey.temperatureMax,
            "siteNotes" :  survey.siteNotes,
            "plantSpecies" : survey.plantSpecies,
            "herbivory" : survey.herbivory,
            "surveyType" :  survey.surveyType,
            "leafCount" : parseInt(survey.leafCount),
            "source" : "Mobile"
        }),
        success: function(response, textStatus, jqXHR){
            alert("Survey #" + i + " is submitted successfully.");
            deleteSurvey(survey);
        },
        error : function(xhr, status){
            navigator.notification.alert("Unexpected error submitting survey #" + i + " with error status: " + xhr.status + ".");
            recordErrorCode(sruvey, xhr.status);
    }});
}
