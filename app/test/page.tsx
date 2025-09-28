import { createClient } from "@/lib/supabase/server"

export default async function TestPage() {
  const supabase = await createClient()
  
  // Test database connection
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Test comics table
  const { data: comics, error: comicsError } = await supabase
    .from("comics")
    .select("id, title, issue_number")
    .limit(5)
  
  // Test profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .limit(5)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User Authentication:</h2>
          {userError ? (
            <p className="text-red-600">Error: {userError.message}</p>
          ) : user ? (
            <p className="text-green-600">✅ User authenticated: {user.email}</p>
          ) : (
            <p className="text-yellow-600">⚠️ No user authenticated</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Comics Table:</h2>
          {comicsError ? (
            <p className="text-red-600">Error: {comicsError.message}</p>
          ) : comics && comics.length > 0 ? (
            <div>
              <p className="text-green-600">✅ Comics table working! Found {comics.length} comics:</p>
              <ul className="list-disc list-inside ml-4">
                {comics.map((comic) => (
                  <li key={comic.id}>{comic.title} #{comic.issue_number}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Comics table exists but no data found</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Profiles Table:</h2>
          {profilesError ? (
            <p className="text-red-600">Error: {profilesError.message}</p>
          ) : profiles && profiles.length > 0 ? (
            <div>
              <p className="text-green-600">✅ Profiles table working! Found {profiles.length} profiles:</p>
              <ul className="list-disc list-inside ml-4">
                {profiles.map((profile) => (
                  <li key={profile.id}>{profile.email} ({profile.role})</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Profiles table exists but no data found</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Next Steps:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>If you see errors, check your Supabase environment variables</li>
            <li>If tables don't exist, run the database setup scripts</li>
            <li>If no data, run the dummy data insertion scripts</li>
            <li>Make sure to update the user_id in comics data with your actual user ID</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
