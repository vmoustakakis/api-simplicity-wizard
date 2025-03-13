
import React from 'react';
import ApiClient from '@/components/ApiClient';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <h1 className="text-2xl font-bold">API Simplicity Wizard</h1>
          <p className="text-muted-foreground">A simple API client for testing endpoints</p>
        </div>
      </header>
      
      <main>
        <ApiClient />
      </main>

      <footer className="border-t mt-8">
        <div className="container py-4 text-center text-sm text-muted-foreground">
          <p>API Simplicity Wizard — Test your API endpoints with ease</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
