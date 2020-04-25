package vaultclient

import (
	"time"

	"github.com/aws/aws-sdk-go/aws/awsutil"
	"github.com/aws/aws-sdk-go/aws/request"
)

const opGenerateAccountAccessKey = "GenerateAccountAccessKey"

type GenerateAccountAccessKeyInput struct {
	AccountName       *string
	ExternalAccessKey *string `locationName:"externalAccessKey"`
	ExternalSecretKey *string `locationName:"externalSecretKey"`
}

// String returns the string representation
func (s GenerateAccountAccessKeyInput) String() string {
	return awsutil.Prettify(s)
}

// Validate inspects the fields of the type to determine if they are valid.
func (s *GenerateAccountAccessKeyInput) Validate() error {
	invalidParams := request.ErrInvalidParams{Context: "GenerateAccountAccessKeyInput"}

	if s.AccountName == nil {
		invalidParams.Add(request.NewErrParamRequired("AccountName"))
	}
	if s.AccountName != nil && len(*s.AccountName) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("AccountName", 1))
	}

	if s.ExternalAccessKey != nil && len(*s.ExternalAccessKey) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("ExternalAccessKey", 1))
	}

	if s.ExternalSecretKey != nil && len(*s.ExternalSecretKey) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("ExternalSecretKey", 1))
	}

	if invalidParams.Len() > 0 {
		return invalidParams
	}
	return nil
}

// SetAccountName sets the AccountName field's value.
func (s *GenerateAccountAccessKeyInput) SetAccountName(v string) *GenerateAccountAccessKeyInput {
	s.AccountName = &v
	return s
}

// SetExternalAccessKey sets the ExternalAccessKey field's value.
func (s *GenerateAccountAccessKeyInput) SetExternalAccessKey(v string) *GenerateAccountAccessKeyInput {
	s.ExternalAccessKey = &v
	return s
}

// SetExternalSecretKey sets the ExternalSecretKey field's value.
func (s *GenerateAccountAccessKeyInput) SetExternalSecretKey(v string) *GenerateAccountAccessKeyInput {
	s.ExternalSecretKey = &v
	return s
}

// GenerateAccountAccessKey API operation generates a new access key for the account
func (c *Vault) GenerateAccountAccessKey(input *GenerateAccountAccessKeyInput) (*GenerateAccountAccessKeyOutput, error) {
	req, out := c.GenerateAccountAccessKeyRequest(input)
	return out, req.Send()
}

// GenerateAccountAccessKeyRequest generates a "aws/request.Request" representing the
// client's request for the GenerateAccountAccessKey operation. The "output" return
// value will be populated with the request's response once the request completes
// successfully.
//
// Use "Send" method on the returned Request to send the API call to the service.
// the "output" return value is not valid until after Send returns without error.
func (c *Vault) GenerateAccountAccessKeyRequest(input *GenerateAccountAccessKeyInput) (req *request.Request, output *GenerateAccountAccessKeyOutput) {
	op := &request.Operation{
		Name:       opGenerateAccountAccessKey,
		HTTPMethod: "POST",
		HTTPPath:   "/",
	}

	if input == nil {
		input = &GenerateAccountAccessKeyInput{}
	}

	output = &GenerateAccountAccessKeyOutput{}
	req = c.newRequest(op, input, output)
	return
}

type GeneratedKey struct {
	ID           *string    `locationName:"id"`
	Value        *string    `locationName:"value"`
	CreateDate   *time.Time `locationName:"createDate"`
	LastUsedDate *time.Time `locationName:"lastUsedDate"`
	Status       *string    `locationName:"status"`
	UserID       *string    `locationName:"userId"`
}

// GenerateAccountAccessKeyOutput contains the response to a successful GenerateAccountAccessKey request.
type GenerateAccountAccessKeyOutput struct {
	GeneratedKey *GeneratedKey `type:"structure" locationName:"data"`
}

// String returns the string representation
func (s GenerateAccountAccessKeyOutput) String() string {
	return awsutil.Prettify(s)
}
