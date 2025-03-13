import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Send, FileText } from "lucide-react";
import RequestBody from "@/components/RequestBody";
import ResponseViewer from "@/components/ResponseViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    type?: string;
    details?: any;
  };
}

const ApiClient: React.FC = () => {
  const [url, setUrl] = useState<string>("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [body, setBody] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleMethodChange = (value: string) => {
    setMethod(value as HttpMethod);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificate(e.target.files[0]);
      toast({
        title: "Certificate uploaded",
        description: `File: ${e.target.files[0].name}`,
      });
    }
  };

  const handleSelectCertificate = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatErrorDetails = (error: any): string => {
    let details = "";
    
    if (error instanceof Error) {
      details = `Error Type: ${error.name}\nMessage: ${error.message}`;
      
      if (error.stack) {
        details += `\n\nStack Trace:\n${error.stack}`;
      }
      
      if (error instanceof TypeError) {
        details += "\n\nThis is a TypeError, which often occurs when:";
        details += "\n- Trying to access properties of undefined or null";
        details += "\n- Calling a non-function value";
        details += "\n- Incompatible value types in an operation";
      } else if (error instanceof SyntaxError) {
        details += "\n\nThis is a SyntaxError, which typically occurs when:";
        details += "\n- JSON parsing failed due to malformed data";
        details += "\n- Invalid syntax in dynamic code evaluation";
      } else if (error instanceof URIError) {
        details += "\n\nThis is a URIError, which occurs when:";
        details += "\n- Malformed URI components in encoding/decoding functions";
      }
    } else if (typeof error === 'object' && error !== null) {
      details = "Error Object Properties:\n";
      for (const key in error) {
        try {
          details += `${key}: ${JSON.stringify(error[key])}\n`;
        } catch (e) {
          details += `${key}: [Circular or non-serializable value]\n`;
        }
      }
    } else {
      details = `Unexpected error: ${String(error)}`;
    }
    
    return details;
  };

  const sendRequest = async () => {
    if (!url) {
      toast({
        title: "URL is required",
        description: "Please enter a URL to send the request",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setResponse(null);
    setErrorDetails(null);
    const startTime = Date.now();

    try {
      let urlObject;
      try {
        urlObject = new URL(url);
      } catch (e) {
        throw new Error(`Invalid URL: ${url}. Make sure to include the protocol (http:// or https://).`);
      }
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        try {
          JSON.parse(body);
          options.body = body;
        } catch (e) {
          const parseError = e as Error;
          throw new Error(`Invalid JSON in request body: ${parseError.message}. Please check your JSON syntax.`);
        }
      }

      if (certificate) {
        console.log("Certificate would be used for SSL: ", certificate.name);
      }

      const res = await fetch(url, options);
      const endTime = Date.now();
      
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let data;
      let parseError = null;
      const contentType = res.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = await res.text();
          
          if (typeof data === 'string' && 
              (data.trim().startsWith('{') || data.trim().startsWith('['))) {
            try {
              data = JSON.parse(data);
            } catch (e) {
              console.log("Response looks like JSON but couldn't be parsed:", e);
            }
          }
        }
      } catch (e) {
        parseError = e as Error;
        data = `Failed to parse response: ${parseError.message}`;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers,
        data,
        time: endTime - startTime,
      });
      
      if (!res.ok) {
        setErrorDetails(`HTTP Error ${res.status} (${res.statusText}): The server returned an error response. 
        
Common causes for HTTP ${res.status}:
${res.status >= 400 && res.status < 500 ? '- Client-side error (invalid request parameters, authentication issues, etc.)' : ''}
${res.status >= 500 ? '- Server-side error (internal errors, service unavailable, etc.)' : ''}
${res.status === 401 ? '- Authentication required or failed' : ''}
${res.status === 403 ? '- Insufficient permissions to access the resource' : ''}
${res.status === 404 ? '- Resource not found at the specified endpoint' : ''}
${res.status === 429 ? '- Rate limit exceeded (too many requests)' : ''}
${res.status === 500 ? '- Internal server error (generic server failure)' : ''}
${res.status === 502 ? '- Bad gateway (upstream server received an invalid response)' : ''}
${res.status === 503 ? '- Service unavailable (server is overloaded or down for maintenance)' : ''}
${res.status === 504 ? '- Gateway timeout (server didn\'t receive timely response from upstream server)' : ''}`);
      }

    } catch (error) {
      console.error("Request error:", error);
      
      const errorObj = error as Error;
      const detailedError = formatErrorDetails(errorObj);
      setErrorDetails(detailedError);
      
      setResponse({
        status: 0,
        statusText: "Error",
        headers: {},
        data: errorObj.message || "Unknown error occurred",
        time: Date.now() - startTime,
        error: {
          message: errorObj.message || "Unknown error occurred",
          stack: errorObj.stack,
          type: errorObj.name,
          details: detailedError
        }
      });
      
      toast({
        title: "Request failed",
        description: errorObj.message || "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="w-full md:w-[120px]">
                <Select value={method} onValueChange={handleMethodChange}>
                  <SelectTrigger className={`bg-method-${method.toLowerCase()} bg-opacity-20 font-medium`}>
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Enter URL (e.g. https://api.example.com/data)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={sendRequest} disabled={loading}>
                {loading ? "Sending..." : <Send className="h-4 w-4 mr-2" />}
                {loading ? "" : "Send"}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">SSL Certificate (PEM)</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectCertificate}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {certificate ? certificate.name : "Select Certificate"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pem"
                  className="hidden"
                  onChange={handleCertificateChange}
                />
              </div>
              {certificate && (
                <div className="text-xs text-muted-foreground">
                  Certificate: {certificate.name} ({Math.round(certificate.size / 1024)} KB)
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Request Body</h3>
              <RequestBody 
                method={method} 
                value={body} 
                onChange={handleBodyChange} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            {errorDetails && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <div className="whitespace-pre-wrap font-mono text-xs overflow-auto max-h-[200px]">
                    {errorDetails}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <ResponseViewer response={response} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiClient;
