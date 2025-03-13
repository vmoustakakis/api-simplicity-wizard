
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ResponseViewerProps {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    time: number;
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
      </Tabs>
    </div>
  );
};

export default ResponseViewer;
