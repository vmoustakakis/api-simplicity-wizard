
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

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}

const ApiClient: React.FC = () => {
  const [url, setUrl] = useState<string>("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [body, setBody] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
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
    const startTime = Date.now();

    try {
      // Check if URL is valid
      const urlObject = new URL(url);
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Add body for methods that support it
      if (method !== "GET" && method !== "HEAD" && body) {
        try {
          // Try to parse as JSON to validate
          JSON.parse(body);
          options.body = body;
        } catch (e) {
          toast({
            title: "Invalid JSON",
            description: "The request body is not valid JSON",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Certificate handling would normally be done on the server
      // For a frontend-only app, we can just acknowledge it
      if (certificate) {
        console.log("Certificate would be used for SSL: ", certificate.name);
        // In a real app, this would be handled by the backend
      }

      const res = await fetch(url, options);
      const endTime = Date.now();
      
      // Process headers
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Try to parse response as JSON, fallback to text if not possible
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers,
        data,
        time: endTime - startTime,
      });
    } catch (error) {
      console.error("Request error:", error);
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
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
            <ResponseViewer response={response} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiClient;
