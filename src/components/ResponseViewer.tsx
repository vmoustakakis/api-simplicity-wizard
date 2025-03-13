
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface ResponseViewerProps {
  response: {
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
  } | null;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ response }) => {
  const [activeTab, setActiveTab] = useState<string>("body");

  if (!response) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md border border-dashed">
        <p className="text-muted-foreground">Send a request to see response</p>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-method-post text-white";
    if (status >= 300 && status < 400) return "bg-method-put text-white";
    if (status >= 400 && status < 500) return "bg-method-delete text-white";
    if (status >= 500) return "bg-destructive text-white";
    if (status === 0) return "bg-destructive text-white"; // For client-side errors
    return "bg-gray-500 text-white";
  };

  const formatJson = (data: any) => {
    try {
      if (typeof data === 'string') {
        // Try to parse if it's a JSON string
        try {
          const parsed = JSON.parse(data);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // If not valid JSON, return as is
          return data;
        }
      }
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const renderedBody = formatJson(response.data);
  const isJsonResponse = typeof renderedBody === 'string' && 
    (renderedBody.startsWith('{') || renderedBody.startsWith('['));
    
  const getNetworkErrorHelp = (errorMessage: string) => {
    if (errorMessage.includes('Failed to fetch')) {
      return (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
          <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
            <AlertCircle className="h-4 w-4" /> Network Connection Error
          </h4>
          <div className="space-y-2 text-xs">
            <p><span className="font-medium">Description:</span> "Failed to fetch" indicates a network-level issue occurred when attempting to connect to the server.</p>
            <p className="font-medium">Possible causes:</p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>No internet connection</li>
              <li>Server is unreachable or down</li>
              <li>CORS (Cross-Origin Resource Sharing) policy restriction</li>
              <li>Invalid SSL certificate for HTTPS requests</li>
              <li>Firewall or proxy blocking the connection</li>
              <li>DNS resolution failure</li>
            </ul>
            <p className="font-medium">Troubleshooting steps:</p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Check your internet connection</li>
              <li>Verify the URL is correct and the server is running</li>
              <li>Check if the API requires CORS headers or if you need to use a proxy</li>
              <li>Verify SSL certificates if using HTTPS</li>
              <li>Try the request in a tool like Postman or cURL to isolate browser issues</li>
              <li>Check browser console for additional network error details</li>
            </ul>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <Badge className={`${getStatusColor(response.status)} px-2 py-1`}>
          {response.status} {response.statusText}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {response.time}ms
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          {response.error && <TabsTrigger value="error">Error</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="body" className="flex-1 mt-2">
          <ScrollArea className="h-[350px] w-full rounded-md border p-2">
            <pre className={`text-xs ${isJsonResponse ? 'language-json' : ''}`}>
              {renderedBody}
            </pre>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="headers" className="flex-1 mt-2">
          <ScrollArea className="h-[350px] w-full rounded-md border p-2">
            <div className="space-y-1">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr,2fr] gap-2 text-xs">
                  <div className="font-medium text-muted-foreground">{key}:</div>
                  <div>{value}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {response.error && (
          <TabsContent value="error" className="flex-1 mt-2">
            <ScrollArea className="h-[350px] w-full rounded-md border p-2">
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="font-medium text-destructive">Message:</div>
                  <div className="whitespace-pre-wrap">{response.error.message}</div>
                </div>
                
                {response.error.type && (
                  <div>
                    <div className="font-medium text-destructive">Type:</div>
                    <div>{response.error.type}</div>
                  </div>
                )}
                
                {response.error.code && (
                  <div>
                    <div className="font-medium text-destructive">Code:</div>
                    <div>{response.error.code}</div>
                  </div>
                )}
                
                {response.error.stack && (
                  <div>
                    <div className="font-medium text-destructive">Stack Trace:</div>
                    <div className="whitespace-pre-wrap">{response.error.stack}</div>
                  </div>
                )}
                
                {response.error.details && (
                  <div>
                    <div className="font-medium text-destructive">Details:</div>
                    <div className="whitespace-pre-wrap">{response.error.details}</div>
                  </div>
                )}
                
                {getNetworkErrorHelp(response.error.message)}
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ResponseViewer;
