aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-6">
          {isAdmin && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {isStaff ? 'Staff Panel' : 'Admin Panel'}
            </div>
          )}

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-50"
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      <div className="h-[81px] lg:hidden" />
    </>
  );
};

export default MobileNav;
