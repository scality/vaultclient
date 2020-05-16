package vaultclient

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awsutil"
	"github.com/aws/aws-sdk-go/aws/request"
)

import "time"

const opCreateAccount = "CreateAccount"

type CreateAccountInput struct {
	Name              *string `locationName:"name"`
	Email             *string `locationName:"emailAddress"`
	QuotaMax          *int64  `locationName:"quotaMax"`
	ExternalAccountID *string `locationName:"externalAccountId"`
}

// String returns the string representation
func (s CreateAccountInput) String() string {
	return awsutil.Prettify(s)
}

// Validate inspects the fields of the type to determine if they are valid.
func (s *CreateAccountInput) Validate() error {
	invalidParams := request.ErrInvalidParams{Context: "CreateAccountInput"}

	if s.Name == nil {
		invalidParams.Add(request.NewErrParamRequired("Name"))
	}
	if s.Name != nil && len(*s.Name) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("Name", 1))
	}

	if s.Email == nil {
		invalidParams.Add(request.NewErrParamRequired("Email"))
	}
	if s.Email != nil && len(*s.Email) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("Email", 1))
	}

	if s.QuotaMax != nil && *s.QuotaMax < 1 {
		invalidParams.Add(request.NewErrParamMinValue("QuotaMax", 1))
	}

	if s.ExternalAccountID != nil && len(*s.ExternalAccountID) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("ExternalAccountID", 1))
	}

	if invalidParams.Len() > 0 {
		return invalidParams
	}
	return nil
}

// SetName sets the Name field's value.
func (s *CreateAccountInput) SetName(v string) *CreateAccountInput {
	s.Name = &v
	return s
}

// SetEmail sets the Email field's value.
func (s *CreateAccountInput) SetEmail(v string) *CreateAccountInput {
	s.Email = &v
	return s
}

// SetQuotaMax sets the QuotaMax field's value.
func (s *CreateAccountInput) SetQuotaMax(v int64) *CreateAccountInput {
	s.QuotaMax = &v
	return s
}

// SetExternalAccountID sets the ExternalAccountID field's value.
func (s *CreateAccountInput) SetExternalAccountID(v string) *CreateAccountInput {
	s.ExternalAccountID = &v
	return s
}

// CreateAccount API operation creates a new Vault account
// and adds the ability to pass a context and additional request options.
//
// The context must be non-nil and will be used for request cancellation. If
// the context is nil a panic will occur. In the future the SDK may create
// sub-contexts for http.Requests. See https://golang.org/pkg/context/
// for more information on using Contexts.
func (c *Vault) CreateAccount(ctx aws.Context, input *CreateAccountInput, opts ...request.Option) (*CreateAccountOutput, error) {
	req, out := c.CreateAccountRequest(input)
	req.SetContext(ctx)
	req.ApplyOptions(opts...)
	return out, req.Send()
}

// CreateAccountRequest generates a "aws/request.Request" representing the
// client's request for the CreateAccount operation. The "output" return
// value will be populated with the request's response once the request completes
// successfully.
//
// Use "Send" method on the returned Request to send the API call to the service.
// the "output" return value is not valid until after Send returns without error.
func (c *Vault) CreateAccountRequest(input *CreateAccountInput) (req *request.Request, output *CreateAccountOutput) {
	op := &request.Operation{
		Name:       opCreateAccount,
		HTTPMethod: "POST",
		HTTPPath:   "/",
	}

	if input == nil {
		input = &CreateAccountInput{}
	}

	output = &CreateAccountOutput{}
	req = c.newRequest(op, input, output)
	return
}

// Account contains information about a Vault account.
type Account struct {
	AccountData *AccountData `type:"structure" locationName:"data"`
}

type AccountData struct {
	Arn         *string    `locationName:"arn"`
	Name        *string    `locationName:"name"`
	Email       *string    `locationName:"emailAddress"`
	ID          *string    `locationName:"id"`
	QuotaMax    *int64     `locationName:"quotaMax"`
	CreateDate  *time.Time `locationName:"createDate"`
	CanonicalID *string    `locationName:"canonicalId"`
	AliasList   []*string  `locationName:"aliasList"`
}

// CreateAccountOutput contains the response to a successful CreateAccount request.
type CreateAccountOutput struct {
	Account *Account `type:"structure" locationName:"account"`
}

// String returns the string representation
func (s CreateAccountOutput) String() string {
	return awsutil.Prettify(s)
}

// GetAccount returns AccountData
func (s CreateAccountOutput) GetAccount() *AccountData {
	return s.Account.AccountData
}
