package vaultclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/aws/session"
	. "github.com/smartystreets/goconvey/convey"
)

var (
	mockAccessKey = "R00M1D0CSSZ7XW84HCG0"
	mockSecretKey = "0gRTPZ1V6gG+sQFWxfkYWSMJKKRaJ8sLa17fR2XL"
	mockStatus    = "Active"
)

func mockGenerateKeyResponseBody(req *http.Request, t *testing.T) mockValue {
	return mockValue{
		"data": mockValue{
			"id":           mockAccessKey,
			"value":        mockSecretKey,
			"createDate":   mockTime,
			"lastUsedDate": mockTime,
			"status":       mockStatus,
			"userId":       mockID,
		},
	}
}

type generateKeyTest struct {
	accountName       *string
	externalAccessKey *string
	externalSecretKey *string
	err               error
	description       string
}

func generateKeyErrorMaker(errs []request.ErrInvalidParam) error {
	return invalidParamsErrorMaker(errs, "GenerateAccountAccessKeyInput")
}

var generateKeyTests = []generateKeyTest{
	generateKeyTest{description: "Should pass with valid accountName", accountName: &mockName, err: nil},
	generateKeyTest{description: "Should pass with valid accountName, externalAccessKey and externalSecretKey", accountName: &mockName, externalAccessKey: &mockAccessKey, externalSecretKey: &mockSecretKey, err: nil},

	generateKeyTest{description: "Should fail if accountName is empty", accountName: aws.String(""), err: generateKeyErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("AccountName", 1)})},
	generateKeyTest{description: "Should fail if accountName is not set", err: generateKeyErrorMaker([]request.ErrInvalidParam{request.NewErrParamRequired("AccountName")})},

	generateKeyTest{description: "Should fail if externalAccessKey is empty", accountName: &mockName, externalAccessKey: aws.String(""), err: generateKeyErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("ExternalAccessKey", 1)})},
	generateKeyTest{description: "Should fail if externalSecretKey is empty", accountName: &mockName, externalSecretKey: aws.String(""), err: generateKeyErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("ExternalSecretKey", 1)})},
	generateKeyTest{description: "Should fail if both externalAccessKey and externalSecretKey are empty", accountName: &mockName, externalAccessKey: aws.String(""), externalSecretKey: aws.String(""), err: generateKeyErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("ExternalAccessKey", 1), request.NewErrParamMinLen("ExternalSecretKey", 1)})},
}

func TestGenerateAccountAccessKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Send response to be tested
		resBody := mockGenerateKeyResponseBody(req, t)
		rjson, err := json.Marshal(resBody)
		if err != nil {
			t.Error(err)
		}
		res.Write(rjson)
	}))
	defer server.Close()

	Convey("Test GenerateAccountAccessKey", t, func() {
		for _, tc := range generateKeyTests {
			description := tc.description
			Convey(description, func() {
				ctx := context.Background()
				sess := session.Must(session.NewSession(&aws.Config{
					Endpoint:   aws.String(server.URL),
					Region:     aws.String("us-east-1"),
					HTTPClient: server.Client(),
				}))
				svc := New(sess)
				params := &GenerateAccountAccessKeyInput{}
				if tc.accountName != nil {
					params.SetAccountName(*tc.accountName)
				}
				if tc.externalSecretKey != nil {
					params.SetExternalSecretKey(*tc.externalSecretKey)
				}
				if tc.externalAccessKey != nil {
					params.SetExternalAccessKey(*tc.externalAccessKey)
				}
				res, err := svc.GenerateAccountAccessKey(ctx, params)
				if tc.err != nil {
					So(err.Error(), ShouldEqual, tc.err.Error())
				} else {
					So(*res.GeneratedKey.ID, ShouldEqual, mockAccessKey)
					So(*res.GeneratedKey.Value, ShouldEqual, mockSecretKey)
					So(*res.GeneratedKey.CreateDate, ShouldEqual, mockTime)
					So(*res.GeneratedKey.LastUsedDate, ShouldEqual, mockTime)
					So(*res.GeneratedKey.Status, ShouldEqual, mockStatus)
					So(*res.GeneratedKey.UserID, ShouldEqual, mockID)
				}
			})
		}
	})
}
