package vaultclient

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awsutil"
	"github.com/aws/aws-sdk-go/aws/request"
)

const opDeleteAccount = "DeleteAccount"

type DeleteAccountInput struct {
	AccountName *string
}

// String returns the string representation
func (s DeleteAccountInput) String() string {
	return awsutil.Prettify(s)
}

// Validate inspects the fields of the type to determine if they are valid.
func (s *DeleteAccountInput) Validate() error {
	invalidParams := request.ErrInvalidParams{Context: "DeleteAccountInput"}

	if s.AccountName == nil {
		invalidParams.Add(request.NewErrParamRequired("AccountName"))
	}
	if s.AccountName != nil && len(*s.AccountName) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("AccountName", 1))
	}

	if invalidParams.Len() > 0 {
		return invalidParams
	}
	return nil
}

// SetAccountName sets the AccountName field's value.
func (s *DeleteAccountInput) SetAccountName(v string) *DeleteAccountInput {
	s.AccountName = &v
	return s
}

// DeleteAccount API operation deletes Vault account
// and adds the ability to pass a context and additional request options.
//
// The context must be non-nil and will be used for request cancellation. If
// the context is nil a panic will occur. In the future the SDK may create
// sub-contexts for http.Requests. See https://golang.org/pkg/context/
// for more information on using Contexts.
func (c *Vault) DeleteAccount(ctx aws.Context, input *DeleteAccountInput, opts ...request.Option) (*DeleteAccountOutput, error) {
	req, out := c.DeleteAccountRequest(input)
	req.SetContext(ctx)
	req.ApplyOptions(opts...)
	return out, req.Send()
}

// DeleteAccountRequest generates a "aws/request.Request" representing the
// client's request for the DeleteAccount operation. The "output" return
// value will be populated with the request's response once the request completes
// successfully.
//
// Use "Send" method on the returned Request to send the API call to the service.
// the "output" return value is not valid until after Send returns without error.
func (c *Vault) DeleteAccountRequest(input *DeleteAccountInput) (req *request.Request, output *DeleteAccountOutput) {
	op := &request.Operation{
		Name:       opDeleteAccount,
		HTTPMethod: "POST",
		HTTPPath:   "/",
	}

	if input == nil {
		input = &DeleteAccountInput{}
	}

	output = &DeleteAccountOutput{}
	req = c.newRequest(op, input, output)
	return
}

// DeleteAccountOutput contains the response to a successful DeleteAccount request.
type DeleteAccountOutput struct{}
