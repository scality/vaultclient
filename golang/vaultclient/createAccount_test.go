package vaultclient

import (
	"bytes"
	"encoding/json"
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

type mockValue map[string]interface{}

var (
	mockName        = "myname"
	mockEmail       = "email@email.com"
	mockQuotaMax    = int64(1)
	mockID          = "893701217479"
	mockCanonicalID = "cdc9948f9124efae674ed122d52ce4d83d18c53ed05dcbf3765db56a051d7496"
	mockCreateDate  = "2020-04-20T01:54:54Z"
	mockArn         = "arn:arn:aws:iam::893701217479:/name/"
	mockTime, _     = time.Parse(time.RFC3339, mockCreateDate)
)

func mockResponseBody(req *http.Request, t *testing.T) mockValue {
	buf := new(bytes.Buffer)
	buf.ReadFrom(req.Body)
	v, err := url.ParseQuery(string(buf.Bytes()))
	if err != nil {
		t.Error(err)
	}
	var quotaMax int64
	if v.Get("quotaMax") != "" {
		quotaMax, err = strconv.ParseInt(v.Get("quotaMax"), 10, 64)
		if err != nil {
			t.Error(err)
		}
	}
	return mockValue{
		"account": mockValue{
			"data": mockValue{
				"id":           mockID,
				"emailAddress": v.Get("emailAddress"),
				"name":         v.Get("name"),
				"quotaMax":     quotaMax,
				"arn":          mockArn,
				"canonicalId":  mockCanonicalID,
				"createDate":   mockCreateDate,
			},
		},
	}
}

type createAccountTest struct {
	name              *string
	email             *string
	quotaMax          *int64
	externalAccountID *string
	err               error
	description       string
}

func invalidParamsErrorMaker(errs []request.ErrInvalidParam, context string) error {
	invalidInputParams := request.ErrInvalidParams{Context: context}
	for _, e := range errs {
		invalidInputParams.Add(e)
	}
	return invalidInputParams
}

func createAccountErrorMaker(errs []request.ErrInvalidParam) error {
	return invalidParamsErrorMaker(errs, "CreateAccountInput")
}

var listCreateAccountTests = []createAccountTest{
	createAccountTest{description: "Should pass with valid name and email", name: &mockName, email: &mockEmail, err: nil},
	createAccountTest{description: "Should pass with valid quotaMax", name: &mockName, email: &mockEmail, quotaMax: &mockQuotaMax, err: nil},
	createAccountTest{description: "Should pass with valid externalAccountID", name: &mockName, email: &mockEmail, externalAccountID: &mockID, err: nil},

	createAccountTest{description: "Should fail if name is empty", name: aws.String(""), email: &mockEmail, quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("Name", 1)})},
	createAccountTest{description: "Should fail if name is not set", email: &mockEmail, quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamRequired("Name")})},
	createAccountTest{description: "Should fail if email is empty", name: &mockName, email: aws.String(""), quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("Email", 1)})},
	createAccountTest{description: "Should fail if email is not set", name: &mockName, quotaMax: &mockQuotaMax, err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamRequired("Email")})},
	createAccountTest{description: "Should fail if quotaMax is set to 0", name: &mockName, email: &mockEmail, quotaMax: aws.Int64(0), err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinValue("QuotaMax", 1)})},
	createAccountTest{description: "Should fail if name and email are not set", err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamRequired("Name"), request.NewErrParamRequired("Email")})},
	createAccountTest{description: "Should fail if externalAccountID is empty", name: &mockName, email: &mockEmail, externalAccountID: aws.String(""), err: createAccountErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("ExternalAccountID", 1)})},
}

func TestCreateAccount(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Send response to be tested
		resBody := mockResponseBody(req, t)
		rjson, err := json.Marshal(resBody)
		if err != nil {
			t.Error(err)
		}
		res.Write(rjson)
	}))
	defer server.Close()

	Convey("Test CreateAccount", t, func() {
		for _, tc := range listCreateAccountTests {
			description := tc.description
			Convey(description, func() {
				sess := session.Must(session.NewSession(&aws.Config{
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
				if tc.externalAccountID != nil {
					params.SetExternalAccountID(*tc.externalAccountID)
				}
				res, err := svc.CreateAccount(params)
				if tc.err != nil {
					So(err.Error(), ShouldEqual, tc.err.Error())
				} else {
					So(*res.GetAccount().Email, ShouldEqual, *tc.email)
					So(*res.GetAccount().Name, ShouldEqual, *tc.name)
					So(*res.GetAccount().ID, ShouldEqual, mockID)
					So(*res.GetAccount().Arn, ShouldEqual, mockArn)
					So(*res.GetAccount().CanonicalID, ShouldEqual, mockCanonicalID)
					So(*res.GetAccount().CreateDate, ShouldEqual, mockTime)
					// optional property
					if tc.quotaMax == nil {
						So(*res.GetAccount().QuotaMax, ShouldEqual, 0)
					} else {
						So(*res.GetAccount().QuotaMax, ShouldEqual, *tc.quotaMax)
					}
				}
			})
		}
	})
}
