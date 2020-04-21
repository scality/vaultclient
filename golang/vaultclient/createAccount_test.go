package vaultclient

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	. "github.com/smartystreets/goconvey/convey"
)

func TestCreateAccount(t *testing.T) {

	// setup (run before each `Convey` at this scope):
	// Close the server when test finishes
	Convey("Test CreateAccount", t, func() {

		server := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
			// Send response to be tested
			fmt.Printf("IT LOOKS LIKE CLIENT RESEND REQUEST MULTIPLE TIMES!!!: %+v", req.Header)
			res.Write([]byte(`OK`))
		}))

		sess := session.Must(session.NewSession(&aws.Config{
			// CredentialsChainVerboseErrors: aws.Bool(true),
			Endpoint:   aws.String(server.URL),
			Region:     aws.String("us-east-1"),
			HTTPClient: server.Client(),
		}))
		svc := New(sess)
		params := &CreateAccountInput{}
		params.SetName("nicolas2bert").SetEmail("email@email.com").SetQuotaMax(10)
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
