package vaultclient

import (
	"github.com/aws/aws-sdk-go/aws/awsutil"
	"github.com/aws/aws-sdk-go/aws/request"
)

import "time"

const opListAccounts = "ListAccounts"

type ListAccountsInput struct {
	Marker   *string
	MaxItems *int64
}

// String returns the string representation
func (s ListAccountsInput) String() string {
	return awsutil.Prettify(s)
}

// Validate inspects the fields of the type to determine if they are valid.
func (s *ListAccountsInput) Validate() error {
	invalidParams := request.ErrInvalidParams{Context: "ListAccountsInput"}

	if s.Marker != nil && len(*s.Marker) < 1 {
		invalidParams.Add(request.NewErrParamMinLen("Marker", 1))
	}

	if s.MaxItems != nil {
		if *s.MaxItems < 1 {
			invalidParams.Add(request.NewErrParamMinValue("MaxItems", 1))
		}
		// TODO: request.NewErrParamMaxValue has not been implemented in sdk-for-go/api/aws/request
		// If we want to check "MaxItems" maximum value on the client-side, we'll need to implement a new "maximum value parameter" error.
		// if *s.MaxItems > 1000 {
		//  invalidParams.Add(request.NewErrParamMaxValue("MaxItems", 1000))
		// }
	}

	if invalidParams.Len() > 0 {
		return invalidParams
	}
	return nil
}

// SetMarker sets the Marker field's value.
func (s *ListAccountsInput) SetMarker(v string) *ListAccountsInput {
	s.Marker = &v
	return s
}

// SetMaxItems sets the MaxItems field's value.
func (s *ListAccountsInput) SetMaxItems(v int64) *ListAccountsInput {
	s.MaxItems = &v
	return s
}

// ListAccounts API operation lists Vault accounts
func (c *Vault) ListAccounts(input *ListAccountsInput) (*ListAccountsOutput, error) {
	req, out := c.ListAccountsRequest(input)
	return out, req.Send()
}

// ListAccountsRequest generates a "aws/request.Request" representing the
// client's request for the ListAccounts operation. The "output" return
// value will be populated with the request's response once the request completes
// successfully.
//
// Use "Send" method on the returned Request to send the API call to the service.
// the "output" return value is not valid until after Send returns without error.
func (c *Vault) ListAccountsRequest(input *ListAccountsInput) (req *request.Request, output *ListAccountsOutput) {
	op := &request.Operation{
		Name:       opListAccounts,
		HTTPMethod: "POST",
		HTTPPath:   "/",
	}

	if input == nil {
		input = &ListAccountsInput{}
	}

	output = &ListAccountsOutput{}
	req = c.newRequest(op, input, output)
	return
}

type AccountFromList struct {
	Arn         *string    `locationName:"arn"`
	Name        *string    `locationName:"name"`
	Email       *string    `locationName:"emailAddress"`
	ID          *string    `locationName:"id"`
	QuotaMax    *int64     `locationName:"quota"`
	CreateDate  *time.Time `locationName:"createDate"`
	CanonicalID *string    `locationName:"canonicalId"`
}

// ListAccountsOutput contains the response to a successful ListAccounts request.
type ListAccountsOutput struct {
	Accounts    []*AccountFromList `locationName:"accounts"`
	IsTruncated *bool              `locationName:"isTruncated"`
	Marker      *string            `locationName:"marker"`
}

// String returns the string representation
func (s ListAccountsOutput) String() string {
	return awsutil.Prettify(s)
}
