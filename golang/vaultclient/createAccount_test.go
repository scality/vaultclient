package vaultclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	. "github.com/smartystreets/goconvey/convey"
)

type value interface{}

func mockResponseBody(req *http.Request, t *testing.T) map[string]map[string]map[string]value {
	buf := new(bytes.Buffer)
	buf.ReadFrom(req.Body)
	fmt.Printf("\n buf.Bytes()!!!: %+v \n", string(buf.Bytes()))
	v, err := url.ParseQuery(string(buf.Bytes()))
	if err != nil {
		t.Error(err)
	}
	quotaMax, err := strconv.ParseInt(v.Get("quotaMax"), 10, 64)
	if err != nil {
		t.Error(err)
	}
	return map[string]map[string]map[string]value{
		"account": map[string]map[string]value{
			"data": map[string]value{
				"id":           "893701217479",
				"emailAddress": v.Get("emailAddress"),
				"name":         v.Get("name"),
				"quotaMax":     quotaMax,
				"arm":          "arn:arn:aws:iam::893701217479:/nicolas2bert/",
				"canonicalId":  "cdc9948f9124efae674ed122d52ce4d83d18c53ed05dcbf3765db56a051d7496",
				"createDate":   "2020-04-20T01:54:54Z",
			},
		},
	}
}

func TestCreateAccount(t *testing.T) {

	// setup (run before each `Convey` at this scope):
	// Close the server when test finishes
	Convey("Test CreateAccount", t, func() {

		server := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
			// Send response to be tested
			resBody := mockResponseBody(req, t)
			rjson, err := json.Marshal(resBody)
			if err != nil {
				t.Error(err)
			}
			res.Write(rjson)
		}))

		sess := session.Must(session.NewSession(&aws.Config{
			// CredentialsChainVerboseErrors: aws.Bool(true),
			Endpoint:   aws.String(server.URL),
			Region:     aws.String("us-east-1"),
			HTTPClient: server.Client(),
		}))
		svc := New(sess)
		params := &CreateAccountInput{}
		params.SetName("nicolas2bert123").SetEmail("email@email.com").SetQuotaMax(10)
		res, err := svc.CreateAccount(params)
		fmt.Printf("res!!!: %+v", res)
		So(err, ShouldBeNil)
		// So(principal.Role, ShouldEqual, aaa.InstanceRole)

		defer server.Close()
	})

	// Reset(func() {
	// 	// This reset is run after each `Convey` at the same scope.
	// 	server.Close()
	// })
}
