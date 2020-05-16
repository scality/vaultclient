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
	mockIsTruncated = true
	mockMarker      = "562385153604"
	mockMaxItems    = aws.Int64(10)
)

func mockListAccountsResponseBody(req *http.Request, t *testing.T) mockValue {
	return mockValue{
		"isTruncated": mockIsTruncated,
		"marker":      mockMarker,
		"accounts": []mockValue{
			mockValue{
				"arn":          mockArn,
				"id":           mockID,
				"name":         mockName,
				"createDate":   mockCreateDate,
				"emailAddress": mockEmail,
				"canonicalId":  mockCanonicalID,
				"quota":        mockQuotaMax,
			},
		},
	}
}

type listAccountsTest struct {
	maxItems    *int64
	marker      *string
	err         error
	description string
}

func listAccountsErrorMaker(errs []request.ErrInvalidParam) error {
	return invalidParamsErrorMaker(errs, "ListAccountsInput")
}

var listListAccountsTests = []listAccountsTest{
	listAccountsTest{description: "Should pass with no optional parameter", err: nil},
	listAccountsTest{description: "Should pass with valid maxItems", maxItems: mockMaxItems, err: nil},
	listAccountsTest{description: "Should pass with valid marker", marker: &mockMarker, err: nil},

	listAccountsTest{description: "Should fail with invalid maxItems", maxItems: aws.Int64(0), err: listAccountsErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinValue("MaxItems", 1)})},
	listAccountsTest{description: "Should fail with invalid marker", marker: aws.String(""), err: listAccountsErrorMaker([]request.ErrInvalidParam{request.NewErrParamMinLen("Marker", 1)})},
}

func TestListAccounts(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Send response to be tested
		resBody := mockListAccountsResponseBody(req, t)
		rjson, err := json.Marshal(resBody)
		if err != nil {
			t.Error(err)
		}
		res.Write(rjson)
	}))
	defer server.Close()

	Convey("Test ListAccounts", t, func() {
		for _, tc := range listListAccountsTests {
			description := tc.description
			Convey(description, func() {
				ctx := context.Background()
				sess := session.Must(session.NewSession(&aws.Config{
					Endpoint:   aws.String(server.URL),
					Region:     aws.String("us-east-1"),
					HTTPClient: server.Client(),
				}))
				svc := New(sess)
				params := &ListAccountsInput{}
				if tc.marker != nil {
					params.SetMarker(*tc.marker)
				}
				if tc.maxItems != nil {
					params.SetMaxItems(*tc.maxItems)
				}
				res, err := svc.ListAccounts(ctx, params)
				if tc.err != nil {
					So(err.Error(), ShouldEqual, tc.err.Error())
				} else {
					So(*res.IsTruncated, ShouldEqual, mockIsTruncated)
					So(*res.Marker, ShouldEqual, mockMarker)
					So(len(res.Accounts), ShouldEqual, 1)
					account := res.Accounts[0]
					So(*account.Email, ShouldEqual, mockEmail)
					So(*account.Name, ShouldEqual, mockName)
					So(*account.ID, ShouldEqual, mockID)
					So(*account.Arn, ShouldEqual, mockArn)
					So(*account.CanonicalID, ShouldEqual, mockCanonicalID)
					So(*account.CreateDate, ShouldEqual, mockTime)
				}
			})
		}
	})
}
