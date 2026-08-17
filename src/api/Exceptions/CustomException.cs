using System;

namespace BikerHub.Api.Exceptions;

public class CustomException : Exception
{

    public CustomException(string message)
        : base(message)
    {
    }
}
