
import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface RequestBodyProps {
  method: string;
  value: string;
  onChange: (value: string) => void;
}

const RequestBody: React.FC<RequestBodyProps> = ({ method, value, onChange }) => {
  const bodyNotSupported = method === "GET" || method === "HEAD";

  if (bodyNotSupported) {
    return (
      <div className="text-muted-foreground text-sm p-4 bg-muted rounded-md">
        Request body is not applicable for {method} requests.
      </div>
    );
  }

  return (
    <Textarea
      placeholder="Enter JSON request body"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-mono text-sm min-h-[200px]"
    />
  );
};

export default RequestBody;
