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
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/aws/session"
	. "github.com/smartystreets/goconvey/convey"
)

type mockValue interface{}

var (
	mockName        = "myname"
	mockEmail       = "email@email.com"
	mockQuotaMax    = int64(1)
	mockID          = "893701217479"
	mockCanonicalID = "cdc9948f9124efae674ed122d52ce4d83d18c53ed05dcbf3765db56a051d7496"
	mockCreateDate  = "2020-04-20T01:54:54Z"
	mockArn         = "arn:arn:aws:iam::893701217479:/name/"
)

var mockTime, _ = time.Parse(time.RFC3339, mockCreateDate)

func mockResponseBody(req *http.Request, t *testing.T) map[string]map[string]map[string]mockValue {
	buf := new(bytes.Buffer)
	buf.ReadFrom(req.Body)
	v, err := url.ParseQuery(string(buf.Bytes()))
	if err != nil {
		t.Error(err)
	}
	quotaMax, err := strconv.ParseInt(v.Get("quotaMax"), 10, 64)
	if err != nil {
		t.Error(err)
	}
	return map[string]map[string]map[string]mockValue{
		"account": map[string]map[string]mockValue{
			"data": map[string]mockValue{
				"id":           mockID,
				"emailAddress": v.Get("emailAddress"),
				"name":         v.Get("name"),
				"quotaMax":     quotaMax,
				"arn":          "arn:arn:aws:iam::893701217479:/name/",
				"canonicalId":  mockCanonicalID,
				"createDate":   mockCreateDate,
			},
		},
	}
}

type createAccountTest struct {
	name     *string
	email    *string
	quotaMax *int64
	err      error
}

func createAccountErrorMaker(errs []request.ErrInvalidParam) error {
	invalidInputParams := request.ErrInvalidParams{Context: "CreateAccountInput"}
	for _, e := range errs {
		invalidInputParams.Add(e)
	}
	return invalidInputParams
}

var listCreateAccountTests = []createAccountTest{
	createAccountTest{name: &mockName, email: &mockEmail, quotaMax: &mockQuotaMax, err: nil},
	createAccountTest{name: aws.String(""), email: &mockEmail, quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("Name", 1)})},
	createAccountTest{email: &mockEmail, quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamRequired("Name")})},

	createAccountTest{name: &mockName, email: aws.String(""), quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("Email", 1)})},
	createAccountTest{name: &mockName, quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamRequired("Email")})},
}

func descriptionString(v *string) string {
	if v != nil {
		if *v == "" {
			return "empty"
		}
		return "\"" + *v + "\""
	}
	return "nil"
}

func TestCreateAccount(t *testing.T) {

	// setup (run before each `Convey` at this scope):
	// Close the server when test finishes
	Convey("Test CreateAccount", t, func() {

		for _, tc := range listCreateAccountTests {
			errorDescription := "no error"
			if tc.err != nil {
				errorDescription = tc.err.Error()
			}
			descName := descriptionString(tc.name)
			descEmail := descriptionString(tc.email)
			description := fmt.Sprintf("With name:%s, email:%s and quotaMax:\"%d\", should return %s", descName, descEmail, *tc.quotaMax, errorDescription)
			Convey(description, func() {
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
				if tc.name != nil {
					params.SetName(*tc.name)
				}
				if tc.email != nil {
					params.SetEmail(*tc.email)
				}
				if tc.quotaMax != nil {
					params.SetQuotaMax(*tc.quotaMax)
				}
				res, err := svc.CreateAccount(params)
				if tc.err != nil {
					So(err.Error(), ShouldEqual, tc.err.Error())
				} else {
					So(*res.GetAccount().Email, ShouldEqual, *tc.email)
					So(*res.GetAccount().Name, ShouldEqual, *tc.name)
					So(*res.GetAccount().QuotaMax, ShouldEqual, *tc.quotaMax)
					So(*res.GetAccount().ID, ShouldEqual, mockID)
					So(*res.GetAccount().Arn, ShouldEqual, mockArn)
					So(*res.GetAccount().CanonicalID, ShouldEqual, mockCanonicalID)
					So(*res.GetAccount().CreateDate, ShouldEqual, mockTime)
				}

				defer server.Close()
			})
		}
	})
}
