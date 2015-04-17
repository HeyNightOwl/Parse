var Mailgun = require('mailgun')
var Assignment = Parse.Object.extend("Assignment")
var Settings = require('cloud/utils/settings')

Parse.Cloud.define("notifySlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    var query = new Parse.Query(Assignment)

    query.equalTo("state", 1)
    return query.count()
  }).then(function(count) {
    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackApi"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          "One of our users has posted a new question! There are a total of ",
          count, " waiting to be claimed."
        ].join(""),
        username: "Night Owl - " + req.settings.get("account")
      })
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("claimedSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    req.question = new Assignment()
    req.question.id = req.params.question

    return req.question.fetch()
  }).then(function(question) {
    return question.get("tutor").fetch()
  }).then(function(tutor) {
    return tutor.get("user").fetch()
  }).then(function(user) {
    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackApi"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          user.get("name"), " (", user.id, ") just claimed question ",
          req.question.id
        ].join(""),
        username: "Night Owl - " + req.settings.get("account")
      })
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
