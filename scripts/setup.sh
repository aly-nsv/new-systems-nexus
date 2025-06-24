#!/bin/bash

echo "🚀 Setting up New Systems Nexus..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please fill in your credentials"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in your environment variables in .env.local"
echo "2. Set up your Clerk application"
echo "3. Set up your Supabase database (run supabase/schema.sql)"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "📚 See README.md for detailed setup instructions"